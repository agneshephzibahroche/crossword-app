import generatedSchedule from "@/lib/generatedPuzzleSchedule.json";
import {
  ANCHOR_DATE,
  type GeneratedMeta,
  generateFallbackPuzzle,
  generateRecentWindow,
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
const recentWindowCache = new Map<string, Map<string, GeneratedMeta>>();

export type { PuzzleArchiveEntry };

export function seedRecentWindow(todayDate: string, days = RECENT_ARCHIVE_DAYS) {
  const normalizedDays = Math.min(days, RECENT_ARCHIVE_DAYS);
  const cacheKey = `${todayDate}:${normalizedDays}`;
  const cached = recentWindowCache.get(cacheKey);

  if (cached) {
    for (const [date, generated] of cached.entries()) {
      runtimeCache.set(date, generated.puzzle);
    }

    return cached;
  }

  const recentDates = Array.from(
    { length: normalizedDays },
    (_, index) => shiftDate(todayDate, -index)
  ).reverse();
  const recentWindow = generateRecentWindow(recentDates);

  for (const [date, generated] of recentWindow.entries()) {
    runtimeCache.set(date, generated.puzzle);
  }

  recentWindowCache.set(cacheKey, recentWindow);
  return recentWindow;
}

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

export function getDateKeyForTimeZone(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function getTodayDateKey(timeZone?: string) {
  if (timeZone) {
    return getDateKeyForTimeZone(timeZone);
  }

  return toDateKey(new Date());
}

export function getPuzzleArchive(
  selectedDate: string,
  days = 10,
  todayDate = getTodayDateKey()
) {
  const today = todayDate;
  const recentWindow =
    days <= RECENT_ARCHIVE_DAYS ? seedRecentWindow(today, days) : null;

  return Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, -index);
    const puzzle = recentWindow?.get(date)?.puzzle ?? getPuzzleForDate(date);

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
