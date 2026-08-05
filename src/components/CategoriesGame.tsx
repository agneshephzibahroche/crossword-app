"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoriesPuzzle } from "@/types/categories";

type Props = {
  puzzle: CategoriesPuzzle;
};

type StoredProgress = {
  solvedCategoryIds: string[];
  mistakes: number;
  elapsedSeconds: number;
  startedAtMs: number | null;
  gameOver: boolean;
  won: boolean;
};

const MAX_MISTAKES = 4;
const STORAGE_PREFIX = "letterbeat-categories-progress-v1";

// Colors are applied in solve order (not category index), so the palette
// always reads accent -> success -> info regardless of which of the day's
// 3 categories a player solves first.
const SOLVE_PALETTE = [
  { bg: "bg-[var(--accent-soft)]", text: "text-[var(--accent-strong)]" },
  { bg: "bg-[var(--success-soft)]", text: "text-[var(--success)]" },
  { bg: "bg-[var(--info-soft)]", text: "text-[var(--info)]" },
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function readStoredProgress(storageKey: string): StoredProgress | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(storageKey);

  if (!saved) {
    return null;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<StoredProgress>;

    if (!Array.isArray(parsed.solvedCategoryIds)) {
      return null;
    }

    return {
      solvedCategoryIds: parsed.solvedCategoryIds,
      mistakes: typeof parsed.mistakes === "number" ? parsed.mistakes : 0,
      elapsedSeconds:
        typeof parsed.elapsedSeconds === "number" ? parsed.elapsedSeconds : 0,
      startedAtMs:
        typeof parsed.startedAtMs === "number" ? parsed.startedAtMs : null,
      gameOver: Boolean(parsed.gameOver),
      won: Boolean(parsed.won),
    };
  } catch {
    return null;
  }
}

export default function CategoriesGame({ puzzle }: Props) {
  const storageKey = `${STORAGE_PREFIX}:${puzzle.date}`;
  const wordToCategory = useMemo(() => {
    const map = new Map<string, string>();
    puzzle.categories.forEach((category) => {
      category.words.forEach((word) => map.set(word, category.id));
    });
    return map;
  }, [puzzle]);

  const [solvedCategoryIds, setSolvedCategoryIds] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "wrong" | "close">("none");
  const [displayOrder, setDisplayOrder] = useState<string[]>(puzzle.words);
  const [shareState, setShareState] = useState<"idle" | "shared" | "failed">(
    "idle"
  );
  const feedbackTimeoutRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    const stored = readStoredProgress(storageKey);

    if (stored) {
      setSolvedCategoryIds(stored.solvedCategoryIds);
      setMistakes(stored.mistakes);
      setElapsedSeconds(stored.elapsedSeconds);
      setStartedAtMs(stored.gameOver ? null : stored.startedAtMs ?? Date.now());
      setGameOver(stored.gameOver);
      setWon(stored.won);
    } else {
      setStartedAtMs(Date.now());
    }

    setDisplayOrder(puzzle.words);
    hasHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hasHydratedRef.current || typeof window === "undefined") {
      return;
    }

    const payload: StoredProgress = {
      solvedCategoryIds,
      mistakes,
      elapsedSeconds,
      startedAtMs,
      gameOver,
      won,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [solvedCategoryIds, mistakes, elapsedSeconds, startedAtMs, gameOver, won, storageKey]);

  useEffect(() => {
    if (gameOver || startedAtMs === null) return;

    const id = window.setInterval(() => {
      const nextElapsed = Math.max(
        0,
        Math.floor((Date.now() - startedAtMs) / 1000)
      );
      setElapsedSeconds((prev) => (prev === nextElapsed ? prev : nextElapsed));
    }, 1000);

    return () => window.clearInterval(id);
  }, [gameOver, startedAtMs]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current !== null) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const remainingWords = displayOrder.filter(
    (word) => !solvedCategoryIds.includes(wordToCategory.get(word) ?? "")
  );

  function toggleWord(word: string) {
    if (gameOver) return;

    setSelected((prev) => {
      if (prev.includes(word)) {
        return prev.filter((item) => item !== word);
      }

      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, word];
    });
  }

  function handleShuffle() {
    setDisplayOrder((prev) => {
      const next = [...prev];
      for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      }
      return next;
    });
  }

  function handleSubmit() {
    if (selected.length !== 4 || gameOver) return;

    const categoryIds = selected.map((word) => wordToCategory.get(word));
    const [first, ...rest] = categoryIds;
    const allMatch = first !== undefined && rest.every((id) => id === first);

    if (allMatch && first) {
      const nextSolved = [...solvedCategoryIds, first];
      setSolvedCategoryIds(nextSolved);
      setSelected([]);
      setFeedback("none");

      if (nextSolved.length === puzzle.categories.length) {
        setGameOver(true);
        setWon(true);
      }

      return;
    }

    const matchCounts = new Map<string, number>();
    categoryIds.forEach((id) => {
      if (!id) return;
      matchCounts.set(id, (matchCounts.get(id) ?? 0) + 1);
    });
    const closest = Math.max(...matchCounts.values());
    const isClose = closest === 3;

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setSelected([]);
    setFeedback(isClose ? "close" : "wrong");

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback("none");
    }, 1600);

    if (nextMistakes >= MAX_MISTAKES) {
      const allCategoryIds = puzzle.categories.map((category) => category.id);
      setSolvedCategoryIds(allCategoryIds);
      setGameOver(true);
      setWon(false);
    }
  }

  async function handleCategoriesCardExport() {
    const width = 1080;
    const height = 1920;
    const centerX = width / 2;
    const editorialFont =
      "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", \"Libre Baskerville\", Georgia, serif";
    const uiFont = "\"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      setShareState("failed");
      return;
    }

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#2a1a49");
    gradient.addColorStop(1, "#160f30");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const backgroundGlow = context.createRadialGradient(
      centerX, height * 0.3, 40, centerX, height * 0.3, width * 0.8
    );
    backgroundGlow.addColorStop(0, "rgba(91,111,214,0.35)");
    backgroundGlow.addColorStop(1, "rgba(91,111,214,0)");
    context.fillStyle = backgroundGlow;
    context.fillRect(0, 0, width, height);

    context.save();
    context.shadowColor = "rgba(10,6,26,0.45)";
    context.shadowBlur = 70;
    context.shadowOffsetY = 28;
    context.fillStyle = "#fffaf5";
    context.beginPath();
    context.roundRect(72, 96, width - 144, height - 192, 52);
    context.fill();
    context.restore();

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "#ffd7df";
    context.beginPath();
    context.roundRect(centerX - 140, 150, 280, 46, 999);
    context.fill();
    context.fillStyle = "#a3275c";
    context.font = `700 18px ${uiFont}`;
    context.fillText("DAILY CATEGORIES", centerX, 176);

    context.fillStyle = "#24163d";
    context.font = `800 88px ${uiFont}`;
    context.fillText("LETTERBEAT", centerX, 264);

    context.fillStyle = "#e84d8a";
    context.font = `700 38px ${uiFont}`;
    context.fillText(puzzle.date, centerX, 330);

    const chipY = 398;
    const chipHeight = 58;
    const chipWidth = 176;
    const chipGap = 20;
    const chipGroupWidth = chipWidth * 2 + chipGap;
    const leftChipX = centerX - chipGroupWidth / 2;
    const rightChipX = leftChipX + chipWidth + chipGap;

    context.fillStyle = "#ffd7df";
    context.beginPath();
    context.roundRect(leftChipX, chipY, chipWidth, chipHeight, 999);
    context.fill();
    context.fillStyle = "#a3275c";
    context.font = `700 26px ${uiFont}`;
    context.fillText(`Time ${formatTime(elapsedSeconds)}`, leftChipX + chipWidth / 2, chipY + 30);

    context.fillStyle = won ? "#c7f3e6" : "#ffe18f";
    context.beginPath();
    context.roundRect(rightChipX, chipY, chipWidth, chipHeight, 999);
    context.fill();
    context.fillStyle = won ? "#0b756b" : "#6f4f09";
    context.font = `700 24px ${uiFont}`;
    context.fillText(
      won ? `${mistakes} mistake${mistakes === 1 ? "" : "s"}` : "Puzzle revealed",
      rightChipX + chipWidth / 2,
      chipY + 30
    );

    const shellTop = 500;
    const shellLeft = 156;
    const shellWidth = width - 312;
    const rowHeight = 210;
    const rowGap = 24;
    const cardPalette = [
      { bg: "#ffd7df", text: "#a3275c" },
      { bg: "#c7f3e6", text: "#0b756b" },
      { bg: "#dbe0ff", text: "#3d4bab" },
    ];

    puzzle.categories.forEach((category, index) => {
      const rowTop = shellTop + index * (rowHeight + rowGap);
      const palette = cardPalette[index % cardPalette.length];

      context.save();
      context.shadowColor = "rgba(36,22,61,0.16)";
      context.shadowBlur = 26;
      context.shadowOffsetY = 10;
      context.fillStyle = palette.bg;
      context.beginPath();
      context.roundRect(shellLeft, rowTop, shellWidth, rowHeight, 32);
      context.fill();
      context.restore();

      context.fillStyle = palette.text;
      context.font = `700 30px ${uiFont}`;
      context.fillText(category.label, centerX, rowTop + 56);

      // Word lengths vary a lot ("OWL" vs "TRICERATOPS"), so a fixed font
      // size and a single line clip past the card edges for the longer
      // combinations. Shrink first; if it's still too wide even at the
      // smallest readable size, wrap onto two lines instead.
      const maxLineWidth = shellWidth - 80;
      const singleLine = category.words.join("  ·  ");
      let singleLineSize = 40;
      context.font = `700 ${singleLineSize}px ${editorialFont}`;
      while (
        context.measureText(singleLine).width > maxLineWidth &&
        singleLineSize > 26
      ) {
        singleLineSize -= 2;
        context.font = `700 ${singleLineSize}px ${editorialFont}`;
      }

      if (context.measureText(singleLine).width <= maxLineWidth) {
        context.fillText(singleLine, centerX, rowTop + 140);
      } else {
        const lineA = category.words.slice(0, 2).join("  ·  ");
        const lineB = category.words.slice(2).join("  ·  ");
        let wrappedSize = 34;

        while (wrappedSize > 18) {
          context.font = `700 ${wrappedSize}px ${editorialFont}`;
          const widest = Math.max(
            context.measureText(lineA).width,
            context.measureText(lineB).width
          );
          if (widest <= maxLineWidth) break;
          wrappedSize -= 2;
        }

        context.font = `700 ${wrappedSize}px ${editorialFont}`;
        context.fillText(lineA, centerX, rowTop + 118);
        context.fillText(lineB, centerX, rowTop + 166);
      }
    });

    context.fillStyle = "#5b4f78";
    context.font = `500 30px ${uiFont}`;
    context.fillText("Play today's puzzle at", centerX, 1550);

    const ctaGradient = context.createLinearGradient(156, 1588, width - 156, 1706);
    ctaGradient.addColorStop(0, "#24163d");
    ctaGradient.addColorStop(1, "#41295e");
    context.fillStyle = ctaGradient;
    context.beginPath();
    context.roundRect(156, 1588, width - 312, 118, 34);
    context.fill();

    context.fillStyle = "#ffffff";
    context.font = `700 34px ${uiFont}`;
    context.fillText("Play Letterbeat", centerX, 1625);
    context.font = `600 28px ${uiFont}`;
    context.fillText("letterbeat.vercel.app", centerX, 1669);

    const fileName = `letterbeat-categories-${puzzle.date}.png`;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    if (!blob) {
      setShareState("failed");
      return;
    }

    const file = new File([blob], fileName, { type: "image/png" });

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file] });
        setShareState("shared");
        window.setTimeout(() => setShareState("idle"), 1800);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          setShareState("idle");
          return;
        }
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);

    setShareState("shared");
    window.setTimeout(() => setShareState("idle"), 1800);
  }

  const mistakesLeft = Math.max(0, MAX_MISTAKES - mistakes);

  return (
    <section className="rounded-[32px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_18px_45px_rgba(18,31,53,0.08)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
            Time {formatTime(elapsedSeconds)}
          </span>
          <span className="rounded-full bg-[var(--card-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
            Groups {solvedCategoryIds.length}/{puzzle.categories.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Mistakes
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: MAX_MISTAKES }, (_, index) => (
              <span
                key={index}
                className={`h-2.5 w-2.5 rounded-full ${
                  index < mistakesLeft
                    ? "bg-[var(--ink)]"
                    : "bg-[var(--line-strong)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-[var(--muted)]">
        Find groups of 4! Tap 4 words that share something in common, then submit.
      </p>

      <div className="mt-5 space-y-2">
        {solvedCategoryIds.map((categoryId, index) => {
          const category = puzzle.categories.find((c) => c.id === categoryId);
          if (!category) return null;
          const palette = SOLVE_PALETTE[index % SOLVE_PALETTE.length];

          return (
            <div
              key={categoryId}
              className={`rounded-2xl ${palette.bg} px-4 py-3 text-center`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${palette.text}`}>
                {category.label}
              </p>
              <p className={`mt-1 font-semibold ${palette.text}`}>
                {category.words.join(" · ")}
              </p>
            </div>
          );
        })}
      </div>

      {remainingWords.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-3">
          {remainingWords.map((word) => {
            const isSelected = selected.includes(word);

            return (
              <button
                key={word}
                type="button"
                onClick={() => toggleWord(word)}
                className={`flex min-h-[72px] items-center justify-center rounded-2xl border px-2 py-3 text-center text-sm font-bold uppercase leading-tight transition sm:text-base ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(163,88,40,0.18)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)]"
                } ${feedback === "wrong" ? "animate-[shake_0.4s]" : ""}`}
              >
                {word}
              </button>
            );
          })}
        </div>
      )}

      {feedback === "close" && (
        <p className="mt-3 text-center text-sm font-semibold text-[var(--accent-strong)]">
          One away!
        </p>
      )}

      {!gameOver && (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setSelected([])}
            disabled={selected.length === 0}
            className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Deselect
          </button>
          <button
            type="button"
            onClick={handleShuffle}
            className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]"
          >
            Shuffle
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.length !== 4}
            className="rounded-full border border-[var(--button-primary-bg)] bg-[var(--button-primary-bg)] px-5 py-2 text-sm font-semibold text-[var(--button-primary-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}

      {gameOver && (
        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] p-5 text-center">
          <h3 className="font-[family-name:var(--font-editorial)] text-2xl text-[var(--ink)]">
            {won ? "Nice work!" : "Puzzle revealed"}
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {won
              ? `Solved in ${formatTime(elapsedSeconds)} with ${mistakes} mistake${mistakes === 1 ? "" : "s"}.`
              : "You've hit the mistake limit -- here's how the groups broke down."}
          </p>
          <button
            type="button"
            onClick={handleCategoriesCardExport}
            className="mt-4 rounded-full border border-[var(--button-primary-bg)] bg-[var(--button-primary-bg)] px-5 py-2 text-sm font-semibold text-[var(--button-primary-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5"
          >
            {shareState === "shared"
              ? "Saved!"
              : shareState === "failed"
                ? "Try again"
                : "Completion Card"}
          </button>
        </div>
      )}
    </section>
  );
}
