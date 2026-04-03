import generatedSchedule from "@/lib/generatedPuzzleSchedule.json";
import {
  ANCHOR_DATE,
  generateFallbackPuzzle,
  RECENT_ARCHIVE_DAYS,
  shiftDate,
  toDateKey,
} from "@/lib/puzzleScheduleCore";
import { Puzzle } from "@/types/puzzle";

type PuzzleArchiveEntry = {
  date: string;
  label: string;
  title: string;
  puzzleId: string;
  isToday: boolean;
  isSelected: boolean;
};

const SCHEDULE = generatedSchedule as Record<string, Puzzle>;
const runtimeCache = new Map<string, Puzzle>();

export type { PuzzleArchiveEntry };

function resolveDate(dateKey: string): Puzzle {
  return (
    SCHEDULE[dateKey] ??
    runtimeCache.get(dateKey) ??
    (() => {
      const fallback = generateFallbackPuzzle(dateKey);
      runtimeCache.set(dateKey, fallback);
      return fallback;
    })()
  );
}

export function getPuzzleForDate(dateKey: string): Puzzle {
  return resolveDate(dateKey);
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function getPuzzleArchive(selectedDate: string, days = 10) {
  const today = getTodayDateKey();
  const recentWindow =
    days <= RECENT_ARCHIVE_DAYS
      ? new Map(
          Array.from({ length: Math.min(days, RECENT_ARCHIVE_DAYS) }, (_, index) => {
            const date = shiftDate(today, -index);
            return [date, resolveDate(date)] as const;
          })
        )
      : null;

  return Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, -index);
    const puzzle = recentWindow?.get(date) ?? getPuzzleForDate(date);

    return {
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
        timeZone: "UTC",
      }),
      title: puzzle.title,
      puzzleId: puzzle.id,
      isToday: date === today,
      isSelected: date === selectedDate,
    };
  });
}

export function getAnchorDateKey() {
  return ANCHOR_DATE;
}
