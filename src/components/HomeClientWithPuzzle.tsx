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
  puzzle: Puzzle;
  today: string;
};

type ArchiveStatus = "fresh" | "started" | "solved";

const THEME_KEY = "letterbeat-theme";
const STATS_KEY = "crossword-daily-stats-v1";
const THEME_EVENT = "letterbeat-theme-change";
const ARCHIVE_EVENT = "letterbeat-archive-change";

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

function getArchiveStatusesSnapshot(
  archive: PuzzleArchiveEntry[]
): Record<string, ArchiveStatus> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsedStats = JSON.parse(
      window.localStorage.getItem(STATS_KEY) ?? '{"solvedDates":[]}'
    ) as { solvedDates?: string[] };
    const solvedDates = new Set(
      Array.isArray(parsedStats.solvedDates) ? parsedStats.solvedDates : []
    );

    const nextStatuses: Record<string, ArchiveStatus> = {};

    for (const entry of archive) {
      if (solvedDates.has(entry.date)) {
        nextStatuses[entry.date] = "solved";
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
        const hasLetters =
          Array.isArray(parsedProgress) &&
          parsedProgress.some(
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

export default function HomeClientWithPuzzle({
  archive,
  puzzle,
  today,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [archiveStatuses, setArchiveStatuses] = useState<
    Record<string, ArchiveStatus>
  >({});
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    let frameId = 0;

    const updateStatuses = () => {
      startTransition(() => {
        setArchiveStatuses(getArchiveStatusesSnapshot(archive));
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--glow-1),transparent_28%),radial-gradient(circle_at_top_right,var(--glow-2),transparent_24%),linear-gradient(180deg,var(--paper),var(--paper-deep))] text-[var(--ink)] transition-colors">
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

          <div className="mt-4 grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-4 py-4 shadow-[0_12px_28px_rgba(18,31,53,0.06)]">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  {puzzle.date === today
                    ? "Today's grid"
                    : "Selected grid"}
                </p>
                {renderStatusBadge(currentStatus, false)}
              </div>
              <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none text-[var(--ink)]">
                {formatLongDate(puzzle.date)}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {totalWords} words to solve
              </p>
            </div>

            <NextPuzzleCountdown />
          </div>
        </header>

        <div className="mt-6">
          <CrosswordGrid puzzle={puzzle} />
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
