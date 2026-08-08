import { PUZZLE_SETS } from "./puzzleSets";
import type { CategoriesPuzzle } from "../types/categories";

export const CATEGORIES_SCHEDULE_START = "2025-01-01";
export const CATEGORIES_SCHEDULE_END = "2028-12-31";

// How many days a puzzle set must sit out before it can be reused.
const RECENT_SET_LOOKBACK_DAYS = 14;

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

function chooseSetForDate(dateKey: string, recentSetIds: string[]) {
  const orderedSets = shuffleWithSeed(PUZZLE_SETS, `categories:${dateKey}`);
  const excludeIds = new Set(recentSetIds);
  return orderedSets.find((set) => !excludeIds.has(set.id)) ?? orderedSets[0];
}

function buildPuzzleFromSet(
  dateKey: string,
  chosenSet: (typeof PUZZLE_SETS)[number]
): CategoriesPuzzle {
  const words = shuffleWithSeed(
    chosenSet.categories.flatMap((category) => category.words),
    `categories-order:${dateKey}`
  );

  return {
    id: `${dateKey}-categories-${hashString(dateKey).toString(16)}`,
    date: dateKey,
    title: `Daily Categories #${(hashString(dateKey) % 900) + 100}`,
    categories: chosenSet.categories.map((category) => ({
      id: category.id,
      label: category.label,
      words: category.words,
    })),
    words,
  };
}

export function pickCategoriesForDate(
  dateKey: string,
  recentSetIds: string[]
): CategoriesPuzzle {
  const chosenSet = chooseSetForDate(dateKey, recentSetIds);
  return buildPuzzleFromSet(dateKey, chosenSet);
}

export function buildCategoriesSchedule(startDate: string, endDate: string) {
  const schedule = new Map<string, CategoriesPuzzle>();
  const usedSetIds: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const recentSetIds = usedSetIds.slice(-RECENT_SET_LOOKBACK_DAYS);
    const chosenSet = chooseSetForDate(cursor, recentSetIds);
    schedule.set(cursor, buildPuzzleFromSet(cursor, chosenSet));
    usedSetIds.push(chosenSet.id);
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
