import generatedCategoriesSchedule from "@/lib/generatedCategoriesSchedule.json";
import { pickCategoriesForDate, shiftDate } from "@/lib/categoriesCore";
import type { CategoriesPuzzle } from "@/types/categories";

type CategoriesArchiveEntry = {
  date: string;
  label: string;
  title: string;
  isToday: boolean;
  isSelected: boolean;
};

export type { CategoriesArchiveEntry };

const SCHEDULE = generatedCategoriesSchedule as Record<string, CategoriesPuzzle>;
const runtimeCache = new Map<string, CategoriesPuzzle>();

export function getCategoriesForDate(dateKey: string): CategoriesPuzzle {
  const scheduled = SCHEDULE[dateKey];

  if (scheduled) {
    return scheduled;
  }

  const cached = runtimeCache.get(dateKey);

  if (cached) {
    return cached;
  }

  // Outside the precomputed range: generate on the fly. Recency avoidance
  // against neighboring dates is skipped here (this only runs for dates
  // beyond the multi-year precomputed schedule), same tradeoff the
  // crossword's fallback path makes at its own boundary.
  const generated = pickCategoriesForDate(dateKey, []);
  runtimeCache.set(dateKey, generated);
  return generated;
}

export function getCategoriesArchive(
  selectedDate: string,
  days = 10,
  todayDate = selectedDate
) {
  const archiveDates = Array.from({ length: days }, (_, index) =>
    shiftDate(todayDate, -index)
  );

  return archiveDates.map((date) => {
    const puzzle = getCategoriesForDate(date);

    return {
      date,
      label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
        timeZone: "UTC",
      }),
      title: puzzle.title,
      isToday: date === todayDate,
      isSelected: date === selectedDate,
    };
  });
}
