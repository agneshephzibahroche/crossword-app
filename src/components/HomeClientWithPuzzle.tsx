"use client";

import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import CrosswordGrid from "@/components/CrosswordGrid";
import NextPuzzleCountdown from "@/components/NextPuzzleCountdown";
import { PuzzleArchiveEntry } from "@/lib/dailyPuzzle";
import { Puzzle } from "@/types/puzzle";
import { ThemeMode } from "@/types/theme";

type Props = {
  archive: PuzzleArchiveEntry[];
  isArchiveView: boolean;
  puzzle: Puzzle;
  today: string;
};

type ArchiveStatus =
  | "fresh"
  | "started"
  | "solved"
  | "completed_with_reveals";

type StoredStats = {
  solvedDates: string[];
  completedWithRevealsDates: string[];
  bestTimeSeconds: number | null;
  cleanSolveTimesByDate: Record<string, number>;
};

const THEME_KEY = "letterbeat-theme";
const STATS_KEY = "crossword-daily-stats-v1";
const IMMEDIATE_CHECKS_KEY = "letterbeat-immediate-checks";
const THEME_EVENT = "letterbeat-theme-change";
const ARCHIVE_EVENT = "letterbeat-archive-change";

function getStoredStatsSnapshot(): StoredStats {
  if (typeof window === "undefined") {
    return {
      solvedDates: [],
      completedWithRevealsDates: [],
      bestTimeSeconds: null,
      cleanSolveTimesByDate: {},
    };
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(STATS_KEY) ?? "{}"
    ) as Partial<StoredStats>;

    const cleanSolveTimesByDate =
      parsed.cleanSolveTimesByDate &&
      typeof parsed.cleanSolveTimesByDate === "object"
        ? Object.fromEntries(
            Object.entries(parsed.cleanSolveTimesByDate).filter(
              ([key, value]) => key && typeof value === "number"
            )
          )
        : {};

    return {
      solvedDates: Array.isArray(parsed.solvedDates) ? parsed.solvedDates : [],
      completedWithRevealsDates: Array.isArray(
        parsed.completedWithRevealsDates
      )
        ? parsed.completedWithRevealsDates
        : [],
      bestTimeSeconds:
        typeof parsed.bestTimeSeconds === "number" &&
        parsed.bestTimeSeconds > 0
          ? parsed.bestTimeSeconds
          : null,
      cleanSolveTimesByDate,
    };
  } catch {
    return {
      solvedDates: [],
      completedWithRevealsDates: [],
      bestTimeSeconds: null,
      cleanSolveTimesByDate: {},
    };
  }
}

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);
  mediaQuery.addEventListener("change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
    mediaQuery.removeEventListener("change", onStoreChange);
  };
}

function subscribeToImmediateChecks(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === IMMEDIATE_CHECKS_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(ARCHIVE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ARCHIVE_EVENT, onStoreChange);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getImmediateChecksSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(IMMEDIATE_CHECKS_KEY) === "true";
}

function getArchiveStatusesSnapshot(
  archive: PuzzleArchiveEntry[]
): Record<string, ArchiveStatus> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsedStats = getStoredStatsSnapshot();
    const solvedDates = new Set(parsedStats.solvedDates);
    const completedWithRevealsDates = new Set(
      parsedStats.completedWithRevealsDates
    );

    const nextStatuses: Record<string, ArchiveStatus> = {};

    for (const entry of archive) {
      if (solvedDates.has(entry.date)) {
        nextStatuses[entry.date] = "solved";
        continue;
      }

      if (completedWithRevealsDates.has(entry.date)) {
        nextStatuses[entry.date] = "completed_with_reveals";
        continue;
      }

      const progressKey = `daily-crossword-progress-${entry.puzzleId}`;
      const rawProgress = window.localStorage.getItem(progressKey);

      if (!rawProgress) {
        nextStatuses[entry.date] = "fresh";
        continue;
      }

      try {
        const parsedProgress = JSON.parse(rawProgress);
        const progressGrid =
          Array.isArray(parsedProgress)
            ? parsedProgress
            : parsedProgress &&
                typeof parsedProgress === "object" &&
                Array.isArray(parsedProgress.grid)
              ? parsedProgress.grid
              : null;
        const hasLetters =
          Array.isArray(progressGrid) &&
          progressGrid.some(
            (row: unknown) =>
              Array.isArray(row) &&
              row.some(
                (cell: unknown) =>
                  typeof cell === "string" && cell !== "" && cell !== "#"
              )
          );

        nextStatuses[entry.date] = hasLetters ? "started" : "fresh";
      } catch {
        nextStatuses[entry.date] = "fresh";
      }
    }

    return nextStatuses;
  } catch {
    return {};
  }
}

function formatLongDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function HomeClientWithPuzzle({
  archive,
  isArchiveView,
  puzzle,
  today,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiveStatuses, setArchiveStatuses] = useState<
    Record<string, ArchiveStatus>
  >({});
  const [statsSummary, setStatsSummary] = useState<StoredStats>({
    solvedDates: [],
    completedWithRevealsDates: [],
    bestTimeSeconds: null,
    cleanSolveTimesByDate: {},
  });
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light"
  );
  const immediateChecks = useSyncExternalStore(
    subscribeToImmediateChecks,
    getImmediateChecksSnapshot,
    () => false
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let frameId = 0;

    const updateStatuses = () => {
      startTransition(() => {
        setArchiveStatuses(getArchiveStatusesSnapshot(archive));
        setStatsSummary(getStoredStatsSnapshot());
      });
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key === STATS_KEY ||
        event.key?.startsWith("daily-crossword-progress-")
      ) {
        updateStatuses();
      }
    };

    const onArchiveChange = () => {
      updateStatuses();
    };

    frameId = window.requestAnimationFrame(updateStatuses);
    window.addEventListener("storage", onStorage);
    window.addEventListener(ARCHIVE_EVENT, onArchiveChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ARCHIVE_EVENT, onArchiveChange);
    };
  }, [archive]);

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const currentStatus = useMemo(() => {
    return archiveStatuses[puzzle.date] ?? "fresh";
  }, [archiveStatuses, puzzle.date]);
  const totalWords = useMemo(() => {
    return puzzle.clues.across.length + puzzle.clues.down.length;
  }, [puzzle.clues.across.length, puzzle.clues.down.length]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function toggleImmediateChecks() {
    const nextValue = !immediateChecks;
    window.localStorage.setItem(
      IMMEDIATE_CHECKS_KEY,
      nextValue ? "true" : "false"
    );
    window.dispatchEvent(new Event(ARCHIVE_EVENT));
  }

  function renderStatusBadge(status: ArchiveStatus, isSelected: boolean) {
    if (status === "solved") {
      return (
        <span
          className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
            isSelected
              ? "bg-white/18 text-[var(--accent-contrast)]"
              : "bg-[var(--success-soft)] text-[var(--success)]"
          }`}
        >
          Solved
        </span>
      );
    }

    if (status === "completed_with_reveals") {
      return (
        <span
          className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
            isSelected
              ? "bg-white/18 text-[var(--accent-contrast)]"
              : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          }`}
        >
          With reveals
        </span>
      );
    }

    if (status === "started") {
      return (
        <span
          className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
            isSelected
              ? "bg-white/18 text-[var(--accent-contrast)]"
              : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
          }`}
        >
          In play
        </span>
      );
    }

    return null;
  }

  const cleanSolveCount = statsSummary.solvedDates.length;
  const revealCompletionCount = statsSummary.completedWithRevealsDates.filter(
    (date) => !statsSummary.solvedDates.includes(date)
  ).length;
  const cleanSolveTimes = Object.values(statsSummary.cleanSolveTimesByDate);
  const averageCleanTime =
    cleanSolveTimes.length > 0
      ? Math.round(
          cleanSolveTimes.reduce((sum, time) => sum + time, 0) /
            cleanSolveTimes.length
        )
      : null;

  return (
    <main className="min-h-[100dvh] bg-transparent text-[var(--ink)] transition-colors">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="border-y border-[var(--line)] py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Letterbeat
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(18,31,53,0.08)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                {theme === "light" ? "Dark" : "Light"}
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(18,31,53,0.08)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                Menu
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex min-h-[132px] flex-col justify-center rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4 shadow-[0_12px_28px_rgba(18,31,53,0.06)]">
              <div className="flex flex-wrap items-center justify-center gap-2 text-center md:justify-start md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {puzzle.date === today
                    ? "Today's grid"
                    : "Selected grid"}
                </p>
                {renderStatusBadge(currentStatus, false)}
              </div>
              <p className="mt-2 text-center font-[family-name:var(--font-editorial)] text-3xl leading-none text-[var(--ink)] md:text-left">
                {formatLongDate(puzzle.date)}
              </p>
              <p className="mt-2 text-center text-sm text-[var(--muted)] md:text-left">
                {totalWords} words to solve
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <CrosswordGrid immediateChecks={immediateChecks} puzzle={puzzle} />
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--overlay)]"
          onClick={() => setMenuOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-[360px] overflow-y-auto border-l border-[var(--line)] bg-[var(--paper)] p-5 shadow-[-20px_0_40px_rgba(18,31,53,0.16)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family-name:var(--font-editorial)] text-3xl">
                Menu
              </h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink)]"
              >
                Close
              </button>
            </div>

            <section className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                  How To Play
                </p>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                >
                  {theme === "light" ? "Dark mode" : "Light mode"}
                </button>
              </div>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">
                <li>
                  Tap a square to move the cursor. Tap it again to switch
                  between Across and Down.
                </li>
                <li>
                  Type letters with your keyboard. Use Check letters or Reveal
                  word if you get stuck.
                </li>
                <li>
                  Your progress, solved streak, and theme are saved
                  automatically.
                </li>
              </ul>
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">
                    Immediate checks
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Lock in correct letters as you type.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={immediateChecks}
                  onClick={toggleImmediateChecks}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full border transition ${
                    immediateChecks
                      ? "border-[var(--accent)] bg-[var(--accent)]"
                      : "border-[var(--line-strong)] bg-[var(--card-muted)]"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 rounded-full bg-white shadow-[0_6px_16px_rgba(18,31,53,0.18)] transition ${
                      immediateChecks ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl">
                  Next Puzzle
                </h3>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Countdown
                </span>
              </div>

              <div className="mt-4">
                <NextPuzzleCountdown isArchiveView={isArchiveView} />
              </div>
            </section>

            <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl">
                  Stats
                </h3>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Your run
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Clean solves
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none">
                    {cleanSolveCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    With reveals
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none">
                    {revealCompletionCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Best clean
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none">
                    {statsSummary.bestTimeSeconds === null
                      ? "--:--"
                      : formatTime(statsSummary.bestTimeSeconds)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Avg. clean
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none">
                    {averageCleanTime === null
                      ? "--:--"
                      : formatTime(averageCleanTime)}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.06)]">
              <div className="flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-editorial)] text-2xl">
                  Past Puzzles
                </h3>
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Last 3
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {archive.map((entry) => (
                  <Link
                    key={entry.date}
                    href={entry.isToday ? "/" : `/?date=${entry.date}`}
                    onClick={() => setMenuOpen(false)}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      entry.isSelected
                        ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_12px_30px_rgba(163,88,40,0.22)]"
                        : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{entry.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStatusBadge(
                          archiveStatuses[entry.date] ?? "fresh",
                          entry.isSelected
                        )}
                        {entry.isToday && (
                          <span
                            className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
                              entry.isSelected
                                ? "bg-white/18 text-[var(--accent-contrast)]"
                                : "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                            }`}
                          >
                            Live
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                Built by:
              </p>
              <p className="mt-3 font-[family-name:var(--font-editorial)] text-xl">
                Agnes Hephzibah Roche
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <a
                  href="mailto:agneshephzibahroche@gmail.com"
                  className="rounded-full bg-[var(--surface)] px-3 py-2 text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                >
                  Email
                </a>
                <a
                  href="https://github.com/agneshephzibahroche"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[var(--surface)] px-3 py-2 text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                >
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/agnes-roche"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[var(--surface)] px-3 py-2 text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                >
                  LinkedIn
                </a>
              </div>
            </section>
          </aside>
        </div>
      )}
    </main>
  );
}
