"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import ClueList from "@/components/ClueList";
import { getCellNumber, getWordCells } from "@/lib/crossword";
import { Direction, Puzzle } from "@/types/puzzle";

type Props = {
  puzzle: Puzzle;
};

type CrosswordStats = {
  solvedDates: string[];
  completedWithRevealsDates: string[];
  bestTimeSeconds: number | null;
  cleanSolveTimesByDate: Record<string, number>;
};

const STATS_KEY = "crossword-daily-stats-v1";
const ARCHIVE_EVENT = "letterbeat-archive-change";

function getWordKey(row: number, col: number, wordDirection: Direction) {
  return `${row}-${col}-${wordDirection}`;
}

function computeCorrectWords(
  puzzle: Puzzle,
  gridToCheck: string[][],
  revealedCells: Set<string>
) {
  const next = new Set<string>();
  const allClues = [
    ...puzzle.clues.across.map((clue) => ({
      ...clue,
      direction: "across" as const,
    })),
    ...puzzle.clues.down.map((clue) => ({
      ...clue,
      direction: "down" as const,
    })),
  ];

  for (const clue of allClues) {
    const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
    const hasRevealedCell = cells.some((cell) =>
      revealedCells.has(`${cell.row}-${cell.col}`)
    );
    const isWordCorrect = cells.every(
      (cell) => gridToCheck[cell.row][cell.col] === puzzle.solution[cell.row][cell.col]
    );

    if (isWordCorrect && !hasRevealedCell) {
      next.add(getWordKey(clue.row, clue.col, clue.direction));
    }
  }

  return next;
}

export default function CrosswordGrid({ puzzle }: Props) {
  const cellInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [direction, setDirection] = useState<Direction>("across");
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [correctWords, setCorrectWords] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [hasShownWin, setHasShownWin] = useState(false);
  const [stats, setStats] = useState<CrosswordStats>({
    solvedDates: [],
    completedWithRevealsDates: [],
    bestTimeSeconds: null,
    cleanSolveTimesByDate: {},
  });
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  const storageKey = `daily-crossword-progress-${puzzle.id}`;
  const emptyGrid = useMemo(
    () => puzzle.grid.map((row) => row.map((cell) => (cell === "#" ? "#" : ""))),
    [puzzle.grid]
  );
  const [userGrid, setUserGrid] = useState<string[][]>(emptyGrid);

  useEffect(() => {
    setUserGrid(emptyGrid);
  }, [emptyGrid]);

  useEffect(() => {
    const raw = localStorage.getItem(STATS_KEY);

    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<CrosswordStats>;
      const cleanSolveTimesByDate =
        parsed.cleanSolveTimesByDate &&
        typeof parsed.cleanSolveTimesByDate === "object"
          ? Object.fromEntries(
              Object.entries(parsed.cleanSolveTimesByDate).filter(
                ([key, value]) => key && typeof value === "number"
              )
            )
          : {};

      setStats({
        solvedDates: Array.isArray(parsed.solvedDates) ? parsed.solvedDates : [],
        completedWithRevealsDates: Array.isArray(
          parsed.completedWithRevealsDates
        )
          ? parsed.completedWithRevealsDates
          : [],
        bestTimeSeconds:
          typeof parsed.bestTimeSeconds === "number"
            ? parsed.bestTimeSeconds
            : null,
        cleanSolveTimesByDate,
      });
    } catch {
      setStats({
        solvedDates: [],
        completedWithRevealsDates: [],
        bestTimeSeconds: null,
        cleanSolveTimesByDate: {},
      });
    }
  }, []);

  const evaluateCorrectWords = useCallback(
    (gridToCheck: string[][]) => {
      setCorrectWords(computeCorrectWords(puzzle, gridToCheck, revealedCells));
    },
    [puzzle, revealedCells]
  );

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length === puzzle.rows &&
          parsed.every(
            (row: unknown) => Array.isArray(row) && row.length === puzzle.cols
          )
        ) {
          const nextGrid = parsed as string[][];
          setUserGrid(nextGrid);
          setCorrectWords(computeCorrectWords(puzzle, nextGrid, new Set()));
        } else {
          setUserGrid(emptyGrid);
          setCorrectWords(computeCorrectWords(puzzle, emptyGrid, new Set()));
        }
      } catch {
        setUserGrid(emptyGrid);
        setCorrectWords(computeCorrectWords(puzzle, emptyGrid, new Set()));
      }
    } else {
      setUserGrid(emptyGrid);
      setCorrectWords(computeCorrectWords(puzzle, emptyGrid, new Set()));
    }

    setWrongCells(new Set());
    setCorrectCells(new Set());
    setRevealedCells(new Set());
    setRevealedWords(new Set());
    setElapsedSeconds(0);
    setShowWinModal(false);
    setHasShownWin(false);
    setSelectedRow(0);
    setSelectedCol(0);
    setDirection("across");
  }, [emptyGrid, puzzle, puzzle.cols, puzzle.rows, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(userGrid));
    window.dispatchEvent(new Event(ARCHIVE_EVENT));
  }, [storageKey, userGrid]);

  useEffect(() => {
    evaluateCorrectWords(userGrid);
  }, [evaluateCorrectWords, userGrid]);

  const isBlackCell = useCallback(
    (row: number, col: number) => puzzle.grid[row][col] === "#",
    [puzzle.grid]
  );

  const moveSelection = useCallback(
    (row: number, col: number) => {
      if (
        row >= 0 &&
        row < puzzle.rows &&
        col >= 0 &&
        col < puzzle.cols &&
        !isBlackCell(row, col)
      ) {
        setSelectedRow(row);
        setSelectedCol(col);
      }
    },
    [isBlackCell, puzzle.cols, puzzle.rows]
  );

  const focusCell = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    window.requestAnimationFrame(() => {
      cellInputRefs.current[key]?.focus();
      cellInputRefs.current[key]?.select();
    });
  }, []);

  function handleCellClick(row: number, col: number) {
    if (isBlackCell(row, col)) return;

    if (selectedRow === row && selectedCol === col) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
      focusCell(row, col);
      return;
    }

    setSelectedRow(row);
    setSelectedCol(col);
    focusCell(row, col);
  }

  function handleSelectClue(
    row: number,
    col: number,
    nextDirection: Direction
  ) {
    setSelectedRow(row);
    setSelectedCol(col);
    setDirection(nextDirection);
    focusCell(row, col);
  }

  function clearCheckedCell(row: number, col: number) {
    const key = `${row}-${col}`;

    setWrongCells((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    setCorrectCells((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function clearRevealedCell(row: number, col: number) {
    const key = `${row}-${col}`;

    setRevealedCells((prev) => {
      if (!prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function clearRevealedWord(row: number, col: number, wordDirection: Direction) {
    const key = getWordKey(row, col, wordDirection);

    setRevealedWords((prev) => {
      if (!prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleCheckAnswers() {
    const wrong = new Set<string>();
    const correct = new Set<string>();

    for (let row = 0; row < puzzle.rows; row += 1) {
      for (let col = 0; col < puzzle.cols; col += 1) {
        if (puzzle.grid[row][col] === "#") continue;

        const typed = userGrid[row][col];
        if (typed === "") continue;

        if (typed === puzzle.solution[row][col]) {
          correct.add(`${row}-${col}`);
        } else {
          wrong.add(`${row}-${col}`);
        }
      }
    }

    setWrongCells(wrong);
    setCorrectCells(correct);
  }

  function clearGrid() {
    setUserGrid(emptyGrid);
    evaluateCorrectWords(emptyGrid);
    setWrongCells(new Set());
    setCorrectCells(new Set());
    setRevealedCells(new Set());
    setRevealedWords(new Set());
  }

  function handleRevealWord() {
    const cells = getWordCells(puzzle, selectedRow, selectedCol, direction);
    if (cells.length === 0) return;

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);

      for (const cell of cells) {
        next[cell.row][cell.col] = puzzle.solution[cell.row][cell.col];
      }
      return next;
    });

    setRevealedCells((prev) => {
      const next = new Set(prev);
      for (const cell of cells) {
        next.add(`${cell.row}-${cell.col}`);
      }
      return next;
    });

    setRevealedWords((prev) => {
      const next = new Set(prev);
      next.add(getWordKey(cells[0].row, cells[0].col, direction));
      return next;
    });

    setWrongCells((prev) => {
      const next = new Set(prev);
      for (const cell of cells) {
        next.delete(`${cell.row}-${cell.col}`);
      }
      return next;
    });

    setCorrectCells((prev) => {
      const next = new Set(prev);
      for (const cell of cells) {
        next.delete(`${cell.row}-${cell.col}`);
      }
      return next;
    });
  }

  const activeWordCells = useMemo(
    () => getWordCells(puzzle, selectedRow, selectedCol, direction),
    [direction, puzzle, selectedCol, selectedRow]
  );

  const activeWordSet = useMemo(
    () => new Set(activeWordCells.map((cell) => `${cell.row}-${cell.col}`)),
    [activeWordCells]
  );

  const completedCellSet = useMemo(() => {
    const next = new Set<string>();
    const allClues = [
      ...puzzle.clues.across.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "across" as const,
      })),
      ...puzzle.clues.down.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "down" as const,
      })),
    ];

    for (const clue of allClues) {
      const key = getWordKey(clue.row, clue.col, clue.direction);
      if (!correctWords.has(key)) {
        continue;
      }

      const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
      for (const cell of cells) {
        next.add(`${cell.row}-${cell.col}`);
      }
    }

    return next;
  }, [correctWords, puzzle]);

  useEffect(() => {
    if (showWinModal) return;

    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [showWinModal, storageKey]);

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (showWinModal || isBlackCell(selectedRow, selectedCol)) {
        return;
      }

      if (revealedCells.has(`${selectedRow}-${selectedCol}`)) {
        return;
      }

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[selectedRow][selectedCol] = letter;
        evaluateCorrectWords(next);
        return next;
      });

      clearCheckedCell(selectedRow, selectedCol);
      clearRevealedCell(selectedRow, selectedCol);
      clearRevealedWord(selectedRow, selectedCol, direction);

      if (direction === "across") {
        moveSelection(selectedRow, selectedCol + 1);
        focusCell(selectedRow, selectedCol + 1);
      } else {
        moveSelection(selectedRow + 1, selectedCol);
        focusCell(selectedRow + 1, selectedCol);
      }
    },
    [
      direction,
      evaluateCorrectWords,
      focusCell,
      isBlackCell,
      moveSelection,
      revealedCells,
      selectedCol,
      selectedRow,
      showWinModal,
    ]
  );

  const handleKeyInput = useCallback(
    (event: { key: string; preventDefault: () => void }, row: number, col: number) => {
      setSelectedRow(row);
      setSelectedCol(col);

      if (showWinModal || isBlackCell(row, col)) {
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        handleLetterInput(event.key.toUpperCase());
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();

        if (revealedCells.has(`${row}-${col}`)) {
          return;
        }

        if (userGrid[row][col]) {
          setUserGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[row][col] = "";
            evaluateCorrectWords(next);
            return next;
          });
        } else if (direction === "across") {
          moveSelection(row, col - 1);
          focusCell(row, col - 1);
        } else {
          moveSelection(row - 1, col);
          focusCell(row - 1, col);
        }

        clearCheckedCell(row, col);
        clearRevealedCell(row, col);
        clearRevealedWord(row, col, direction);
        return;
      }

      if (event.key === " " || event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        setDirection((prev) => (prev === "across" ? "down" : "across"));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(row, col + 1);
        focusCell(row, col + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(row, col - 1);
        focusCell(row, col - 1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(row + 1, col);
        focusCell(row + 1, col);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(row - 1, col);
        focusCell(row - 1, col);
      }
    },
    [
      direction,
      evaluateCorrectWords,
      focusCell,
      handleLetterInput,
      isBlackCell,
      moveSelection,
      revealedCells,
      showWinModal,
      userGrid,
    ]
  );

  const handleCellInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      const letter = event.currentTarget.value.slice(-1).toUpperCase();
      setSelectedRow(row);
      setSelectedCol(col);

      if (/^[A-Z]$/.test(letter)) {
        handleLetterInput(letter);
        return;
      }

      if (letter === "") {
        setUserGrid((prev) => {
          const next = prev.map((currentRow) => [...currentRow]);
          next[row][col] = "";
          evaluateCorrectWords(next);
          return next;
        });
        clearCheckedCell(row, col);
      }
    },
    [evaluateCorrectWords, handleLetterInput]
  );

  const isComplete = useMemo(() => {
    if (puzzle.clues.across.length + puzzle.clues.down.length === 0) {
      return false;
    }

    for (let row = 0; row < puzzle.rows; row += 1) {
      for (let col = 0; col < puzzle.cols; col += 1) {
        if (puzzle.grid[row][col] === "#") continue;

        if (userGrid[row][col] !== puzzle.solution[row][col]) {
          return false;
        }
      }
    }

    return true;
  }, [puzzle, userGrid]);

  useEffect(() => {
    if (!isComplete || hasShownWin) return;

    setShowWinModal(true);
    setHasShownWin(true);

    const hasReveals = revealedCells.size > 0;
    const cleanSolveTimesByDate = { ...stats.cleanSolveTimesByDate };
    const completedWithRevealsDates = hasReveals
      ? stats.solvedDates.includes(puzzle.date)
        ? stats.completedWithRevealsDates.filter((date) => date !== puzzle.date)
        : Array.from(
            new Set([...stats.completedWithRevealsDates, puzzle.date])
          ).sort()
      : stats.completedWithRevealsDates.filter((date) => date !== puzzle.date);

    const solvedDates = hasReveals
      ? stats.solvedDates
      : stats.solvedDates.includes(puzzle.date)
        ? stats.solvedDates
        : [...stats.solvedDates, puzzle.date].sort();

    if (!hasReveals) {
      cleanSolveTimesByDate[puzzle.date] =
        typeof cleanSolveTimesByDate[puzzle.date] === "number"
          ? Math.min(cleanSolveTimesByDate[puzzle.date], elapsedSeconds)
          : elapsedSeconds;
    }

    const bestTimeCandidates = Object.values(cleanSolveTimesByDate);
    const nextStats: CrosswordStats = {
      solvedDates,
      completedWithRevealsDates,
      bestTimeSeconds:
        bestTimeCandidates.length > 0 ? Math.min(...bestTimeCandidates) : null,
      cleanSolveTimesByDate,
    };

    setStats(nextStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    window.dispatchEvent(new Event(ARCHIVE_EVENT));
  }, [elapsedSeconds, hasShownWin, isComplete, puzzle.date, revealedCells.size, stats]);

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function buildShareGridSafe() {
    const blackSquare = "\u2B1B";
    const revealedSquare = "\uD83D\uDFE8";
    const solvedSquare = "\uD83D\uDFE9";

    return puzzle.grid
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            if (cell === "#") {
              return blackSquare;
            }

            if (revealedCells.has(`${rowIndex}-${colIndex}`)) {
              return revealedSquare;
            }

            return solvedSquare;
          })
          .join("")
      )
      .join("\n");
  }

  // Legacy helper kept temporarily while cleaning old encoded source text.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function buildShareGrid() {
    return puzzle.grid
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            if (cell === "#") {
              return "⬛";
            }

            if (revealedCells.has(`${rowIndex}-${colIndex}`)) {
              return "🟨";
            }

            return "🟩";
          })
          .join("")
      )
      .join("\n");
  }

  async function handleShareResult() {
    const text = [
      `Letterbeat ${puzzle.date}`,
      `Solved in ${formatTime(elapsedSeconds)}`,
      buildShareGridSafe(),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      setShareState("idle");
    }
  }

  const activeClue = useMemo(() => {
    const clueList =
      direction === "across" ? puzzle.clues.across : puzzle.clues.down;

    return (
      clueList.find(
        (clue) =>
          clue.row === activeWordCells[0]?.row &&
          clue.col === activeWordCells[0]?.col
      ) ??
      clueList.find(
        (clue) => clue.row === selectedRow && clue.col === selectedCol
      ) ??
      null
    );
  }, [activeWordCells, direction, puzzle, selectedCol, selectedRow]);

  const totalWordCount = puzzle.clues.across.length + puzzle.clues.down.length;
  const completedCount = correctWords.size;
  const fillProgress = Math.round((completedCount / totalWordCount) * 100);
  const hasReveals = revealedCells.size > 0;

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_18px_45px_rgba(18,31,53,0.08)] sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(420px,540px)_minmax(0,1fr)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                  Time {formatTime(elapsedSeconds)}
                </span>
                <span className="rounded-full bg-[var(--card-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                  Progress {completedCount}/{totalWordCount}
                </span>
                <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
                  Autosaved
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Active clue
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-tight">
                    {activeClue
                      ? `${activeClue.number}. ${activeClue.clue}`
                      : "Select a clue to begin"}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {direction === "across" ? "Across" : "Down"} |{" "}
                    {activeWordCells.length} letters
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[var(--card-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                    style={{ width: `${fillProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCheckAnswers}
                  className="rounded-full border border-transparent bg-[var(--button-primary-bg)] px-4 py-2 text-sm font-semibold text-[var(--button-primary-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:bg-[var(--button-primary-hover)] active:translate-y-0 active:text-black active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Check letters
                </button>

                <button
                  type="button"
                  onClick={handleRevealWord}
                  className="rounded-full border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-4 py-2 text-sm font-semibold text-[var(--button-secondary-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--button-secondary-hover)] active:translate-y-0 active:text-black active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Reveal word
                </button>

                <button
                  type="button"
                  onClick={clearGrid}
                  className="rounded-full border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-4 py-2 text-sm font-semibold text-[var(--button-secondary-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--line)] hover:bg-[var(--button-secondary-hover)] active:translate-y-0 active:text-black active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Clear board
                </button>

              </div>

              <section className="flex justify-center rounded-[28px] border border-[var(--line)] bg-[var(--card-muted)] p-4 sm:p-5">
                <div className="relative inline-block rounded-[24px] border border-[var(--line-strong)] bg-[var(--surface)] p-2 shadow-[0_12px_24px_rgba(18,31,53,0.06)] sm:p-3">
                  {puzzle.grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                      {row.map((cell, colIndex) => {
                        const isBlack = cell === "#";
                        const isSelected =
                          rowIndex === selectedRow && colIndex === selectedCol;
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const isInActiveWord = activeWordSet.has(cellKey);
                        const isWrong = wrongCells.has(cellKey);
                        const isCorrect = correctCells.has(cellKey);
                        const isRevealed = revealedCells.has(cellKey);
                        const isInCompletedWord =
                          completedCellSet.has(cellKey);

                        const cellNumber = getCellNumber(
                          puzzle,
                          rowIndex,
                          colIndex
                        );

                        return (
                          <div
                            key={cellKey}
                            className={[
                              "relative flex h-12 w-12 items-center justify-center border text-lg font-black uppercase transition-all duration-150 ease-out sm:h-14 sm:w-14",
                              isBlack
                                ? "border-[var(--black-cell)] bg-[var(--black-cell)]"
                                : "border-[var(--line-strong)] bg-[var(--cell-bg)] text-[var(--cell-text)]",
                              !isBlack && isInActiveWord
                                ? "bg-[var(--accent-soft)]"
                                : "",
                              isSelected
                                ? "z-10 scale-[1.03] border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_12px_24px_rgba(163,88,40,0.28)]"
                                : "",
                              isRevealed
                                ? "bg-[var(--card-muted)] text-[var(--ink-soft)]"
                                : "",
                              isInCompletedWord
                                ? "bg-[var(--success-soft)]"
                                : "",
                              isCorrect ? "bg-[var(--success)] text-[var(--accent-contrast)]" : "",
                              isWrong ? "bg-[var(--danger)] text-[var(--accent-contrast)]" : "",
                            ].join(" ")}
                          >
                            {!isBlack && cellNumber !== null && (
                              <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-[var(--muted)]">
                                {cellNumber}
                              </span>
                            )}
                            {!isBlack ? (
                              <input
                                ref={(node) => {
                                  cellInputRefs.current[cellKey] = node;
                                }}
                                type="text"
                                inputMode="text"
                                autoCapitalize="characters"
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck={false}
                                maxLength={1}
                                value={userGrid[rowIndex]?.[colIndex] ?? ""}
                                readOnly={isRevealed}
                                aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                onFocus={() => {
                                  setSelectedRow(rowIndex);
                                  setSelectedCol(colIndex);
                                }}
                                onChange={(event) =>
                                  handleCellInputChange(event, rowIndex, colIndex)
                                }
                                onKeyDown={(event) =>
                                  handleKeyInput(event, rowIndex, colIndex)
                                }
                                className="h-full w-full bg-transparent text-center text-[color:inherit] outline-none caret-[var(--accent)]"
                              />
                            ) : (
                              ""
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <ClueList
                puzzle={puzzle}
                activeDirection={direction}
                activeRow={activeWordCells[0]?.row ?? selectedRow}
                activeCol={activeWordCells[0]?.col ?? selectedCol}
                completedWords={correctWords}
                revealedWords={revealedWords}
                onSelectClue={handleSelectClue}
              />
            </div>
          </div>
        </section>
      </div>

      {showWinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.55)] p-4"
          onClick={() => setShowWinModal(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[0_28px_60px_rgba(18,31,53,0.18)]"
          >
            <h2 className="font-[family-name:var(--font-editorial)] text-3xl">
              Puzzle complete
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              You{" "}
              <span className="font-bold">
                {hasReveals ? "completed with reveals" : "solved"}
              </span>{" "}
              <span className="font-bold">puzzle {puzzle.date}</span>.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <div>
                Time: <span className="font-bold">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--line)] bg-[var(--card-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Puzzle note
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink)]">
                {puzzle.note}
              </p>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="inline-block rounded-[24px] border border-[var(--line-strong)] bg-[var(--paper)] p-2 shadow-[0_12px_24px_rgba(18,31,53,0.06)]">
                {puzzle.solution.map((row, rowIndex) => (
                  <div key={`win-${rowIndex}`} className="flex">
                    {row.map((cell, colIndex) => {
                      const isBlack = cell === "#";
                      const cellNumber = getCellNumber(puzzle, rowIndex, colIndex);

                      return (
                        <div
                          key={`win-${rowIndex}-${colIndex}`}
                          className={[
                            "relative flex h-9 w-9 items-center justify-center border text-sm font-black uppercase sm:h-10 sm:w-10",
                            isBlack
                              ? "border-[var(--black-cell)] bg-[var(--black-cell)]"
                              : "border-[var(--line-strong)] bg-[var(--cell-bg)] text-[var(--cell-text)]",
                          ].join(" ")}
                        >
                          {!isBlack && cellNumber !== null && (
                            <span className="absolute left-1 top-0.5 text-[8px] font-semibold text-[var(--muted)]">
                              {cellNumber}
                            </span>
                          )}
                          {!isBlack ? cell : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
              >
                Close
              </button>

              <button
                type="button"
                onClick={clearGrid}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Clear board
              </button>

              <button
                type="button"
                onClick={handleShareResult}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
              >
                {shareState === "copied" ? "Copied" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
