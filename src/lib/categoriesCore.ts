import { CATEGORY_POOL, CategoryDefinition } from "./categoryPool";
import type { CategoriesPuzzle } from "../types/categories";

export const CATEGORIES_SCHEDULE_START = "2025-01-01";
export const CATEGORIES_SCHEDULE_END = "2028-12-31";

// How many days a category must sit out before it can be reused. The pool
// (77 categories, 3 picked/day) comfortably supports this without ever
// forcing the relaxed fallback below.
const RECENT_CATEGORY_LOOKBACK_DAYS = 20;

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed) || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: string) {
  const random = createSeededRandom(seed);
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

function selectThree(
  orderedPool: CategoryDefinition[],
  excludeIds: Set<string>
): CategoryDefinition[] | null {
  const chosen: CategoryDefinition[] = [];
  const usedWords = new Set<string>();

  for (const category of orderedPool) {
    if (excludeIds.has(category.id)) {
      continue;
    }

    if (category.words.some((word) => usedWords.has(word))) {
      continue;
    }

    chosen.push(category);
    category.words.forEach((word) => usedWords.add(word));

    if (chosen.length === 3) {
      return chosen;
    }
  }

  return null;
}

export function pickCategoriesForDate(
  dateKey: string,
  recentCategoryIds: string[]
): CategoriesPuzzle {
  const orderedPool = shuffleWithSeed(CATEGORY_POOL, `categories:${dateKey}`);
  const excludeIds = new Set(recentCategoryIds);
  // Preferred tier: avoid every category used in the lookback window. If the
  // pool were ever exhausted (it isn't, at 77 categories for 3/day), fall
  // back to ignoring recency rather than failing to produce a puzzle.
  const chosen = selectThree(orderedPool, excludeIds) ?? selectThree(orderedPool, new Set());

  if (!chosen) {
    throw new Error(`Unable to select categories for ${dateKey}`);
  }

  const words = shuffleWithSeed(
    chosen.flatMap((category) => category.words),
    `categories-order:${dateKey}`
  );

  return {
    id: `${dateKey}-categories-${hashString(dateKey).toString(16)}`,
    date: dateKey,
    title: `Daily Categories #${(hashString(dateKey) % 900) + 100}`,
    categories: chosen.map((category) => ({
      id: category.id,
      label: category.label,
      words: category.words,
    })),
    words,
  };
}

export function buildCategoriesSchedule(startDate: string, endDate: string) {
  const schedule = new Map<string, CategoriesPuzzle>();
  const usedHistory: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const picked = pickCategoriesForDate(
      cursor,
      usedHistory.slice(-RECENT_CATEGORY_LOOKBACK_DAYS * 3)
    );
    schedule.set(cursor, picked);
    usedHistory.push(...picked.categories.map((category) => category.id));
    cursor = shiftDate(cursor, 1);
  }

  return schedule;
}

export function buildSerializedCategoriesSchedule(
  startDate: string,
  endDate: string
) {
  return Object.fromEntries(
    buildCategoriesSchedule(startDate, endDate)
  ) as Record<string, CategoriesPuzzle>;
}
