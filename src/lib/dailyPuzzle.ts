import { DICTIONARY, DictionaryEntry, getEntryClue } from "@/lib/dictionary";
import { findSlots, Slot } from "@/lib/findSlots";
import { Puzzle } from "@/types/puzzle";

type PuzzleArchiveEntry = {
  date: string;
  label: string;
  title: string;
  puzzleId: string;
  isToday: boolean;
  isSelected: boolean;
};

type PatternTemplate = {
  id: string;
  title: string;
  grid: string[][];
};

type GeneratedMeta = {
  patternId: string;
  signature: string;
  wordSignature: string;
  clues: string[];
  puzzle: Puzzle;
};

type GenerateOptions = {
  attemptBudget?: number;
  seedSalt?: string;
  requireUniqueClues?: boolean;
};

const ANCHOR_DATE = "2020-01-01";
const RECENT_SIGNATURE_LOOKBACK = 24;
const RECENT_WORDSET_LOOKBACK = 12;
const RECENT_PATTERN_LOOKBACK = 4;
const MAX_ATTEMPTS = 40;
const STRICT_WINDOW_ATTEMPTS = 36;
const WINDOW_RETRY_ATTEMPTS = 6;
const RECENT_ARCHIVE_DAYS = 3;
const RECENT_ARCHIVE_LOOKBACK = RECENT_ARCHIVE_DAYS - 1;

const PATTERN_TEMPLATES: PatternTemplate[] = [
  {
    id: "classic",
    title: "Letterbeat",
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
  },
  {
    id: "triple-stack",
    title: "Ribbon Grid",
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "hourglass",
    title: "Spark Grid",
    grid: [
      ["", "#", "", "#", ""],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["", "#", "", "#", ""],
    ],
  },
  {
    id: "pillars",
    title: "Pulse Grid",
    grid: [
      ["", "", "", "", ""],
      ["#", "", "#", "", "#"],
      ["", "", "", "", ""],
      ["#", "", "#", "", "#"],
      ["", "", "", "", ""],
    ],
  },
];

const generatedCache = new Map<string, GeneratedMeta>();
const DICTIONARY_BY_LENGTH = new Map<number, DictionaryEntry[]>();
const PATTERN_SLOTS = new Map<string, Slot[]>();
const WINDOW_CACHE = new Map<string, Map<string, GeneratedMeta>>();

export type { PuzzleArchiveEntry };

for (const entry of DICTIONARY) {
  const existing = DICTIONARY_BY_LENGTH.get(entry.word.length) ?? [];
  existing.push(entry);
  DICTIONARY_BY_LENGTH.set(entry.word.length, existing);
}

for (const pattern of PATTERN_TEMPLATES) {
  PATTERN_SLOTS.set(pattern.id, findSlots(pattern.grid));
}

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

function getEntryPriority(entry: DictionaryEntry, seed: string) {
  const baseScore = entry.quality * 100;
  const lengthBonus = entry.word.length * 6;
  const shortFillPenalty = entry.tags.includes("short-fill") ? -18 : 0;
  const tieBreaker = hashString(`${seed}:${entry.word}`) % 17;

  return baseScore + lengthBonus + shortFillPenalty + tieBreaker;
}

function sortCandidates(
  candidates: DictionaryEntry[],
  seed: string
) {
  return [...candidates].sort(
    (left, right) =>
      getEntryPriority(right, seed) - getEntryPriority(left, seed)
  );
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

function cloneGrid(grid: string[][]) {
  return grid.map((row) => [...row]);
}

function getSlotKey(slot: Slot) {
  return `${slot.row}-${slot.col}-${slot.direction}`;
}

function getCellsForSlot(slot: Slot) {
  return Array.from({ length: slot.length }, (_, index) => ({
    row: slot.direction === "across" ? slot.row : slot.row + index,
    col: slot.direction === "across" ? slot.col + index : slot.col,
  }));
}

function fitsWord(grid: string[][], slot: Slot, word: string) {
  const cells = getCellsForSlot(slot);

  return cells.every(({ row, col }, index) => {
    const existing = grid[row][col];
    return existing === "" || existing === word[index];
  });
}

function placeWord(grid: string[][], slot: Slot, word: string) {
  const cells = getCellsForSlot(slot);
  const previous = cells.map(({ row, col }) => grid[row][col]);

  cells.forEach(({ row, col }, index) => {
    grid[row][col] = word[index];
  });

  return previous;
}

function restoreWord(grid: string[][], slot: Slot, previous: string[]) {
  const cells = getCellsForSlot(slot);

  cells.forEach(({ row, col }, index) => {
    grid[row][col] = previous[index];
  });
}

function selectSlots(slots: Slot[], grid: string[][], usedWords: Set<string>, seed: string) {
  let bestSlot: Slot | null = null;
  let bestCandidates: DictionaryEntry[] = [];

  for (const slot of slots) {
    const candidates = (DICTIONARY_BY_LENGTH.get(slot.length) ?? []).filter(
      (entry) =>
        entry.allowInDaily &&
        !usedWords.has(entry.word) &&
        fitsWord(grid, slot, entry.word)
    );

    if (candidates.length === 0) {
      return { slot, candidates };
    }

    if (!bestSlot || candidates.length < bestCandidates.length) {
      bestSlot = slot;
      bestCandidates = sortCandidates(
        shuffleWithSeed(
          candidates,
          `${seed}:${slot.row}:${slot.col}:${slot.direction}`
        ),
        `${seed}:${slot.row}:${slot.col}:${slot.direction}`
      );
    }
  }

  return {
    slot: bestSlot,
    candidates: bestCandidates,
  };
}

function fillGrid(grid: string[][], slots: Slot[], seed: string) {
  const assignment = new Map<string, DictionaryEntry>();
  const usedWords = new Set<string>();

  function backtrack(remaining: Slot[]): boolean {
    if (remaining.length === 0) {
      return true;
    }

    const { slot, candidates } = selectSlots(remaining, grid, usedWords, seed);

    if (!slot || candidates.length === 0) {
      return false;
    }

    const nextRemaining = remaining.filter((candidateSlot) => candidateSlot !== slot);

    for (const candidate of candidates) {
      const previous = placeWord(grid, slot, candidate.word);
      usedWords.add(candidate.word);
      assignment.set(getSlotKey(slot), candidate);

      if (backtrack(nextRemaining)) {
        return true;
      }

      restoreWord(grid, slot, previous);
      usedWords.delete(candidate.word);
      assignment.delete(getSlotKey(slot));
    }

    return false;
  }

  if (!backtrack(slots)) {
    return null;
  }

  return assignment;
}

function buildPuzzle(dateKey: string, pattern: PatternTemplate, seed: string) {
  const grid = cloneGrid(pattern.grid);
  const solution = cloneGrid(pattern.grid);
  const slots = PATTERN_SLOTS.get(pattern.id) ?? findSlots(pattern.grid);
  const assignment = fillGrid(solution, slots, seed);

  if (!assignment) {
    return null;
  }

  const across = slots
    .filter((slot) => slot.direction === "across")
    .map((slot) => {
      const entry = assignment.get(getSlotKey(slot));

      if (!entry) {
        throw new Error(`Missing across entry for ${getSlotKey(slot)}`);
      }

      return {
        number: slot.number,
        row: slot.row,
        col: slot.col,
        clue: getEntryClue(entry, `${dateKey}:${slot.number}:across`),
        answer: entry.word,
      };
    });

  const down = slots
    .filter((slot) => slot.direction === "down")
    .map((slot) => {
      const entry = assignment.get(getSlotKey(slot));

      if (!entry) {
        throw new Error(`Missing down entry for ${getSlotKey(slot)}`);
      }

      return {
        number: slot.number,
        row: slot.row,
        col: slot.col,
        clue: getEntryClue(entry, `${dateKey}:${slot.number}:down`),
        answer: entry.word,
      };
    });

  const signature = solution.map((row) => row.join("")).join("|");
  const wordSignature = [...assignment.values()]
    .map((entry) => entry.word)
    .sort()
    .join("|");
  const clueList = [...across, ...down].map((entry) => entry.clue);

  return {
    patternId: pattern.id,
    signature,
    wordSignature,
    clues: clueList,
    puzzle: {
      id: `${dateKey}-${pattern.id}-${hashString(signature).toString(16)}`,
      date: dateKey,
      title: `${pattern.title} #${(hashString(seed) % 900) + 100}`,
      rows: 5,
      cols: 5,
      grid,
      solution,
      clues: {
        across,
        down,
      },
    },
  };
}

function generateSingleDate(
  dateKey: string,
  previousDates: string[],
  localCache: Map<string, GeneratedMeta>,
  options: GenerateOptions = {}
) {
  const {
    attemptBudget = MAX_ATTEMPTS,
    seedSalt = "",
    requireUniqueClues = false,
  } = options;
  const recentSignatures = new Set<string>();
  const recentWordSignatures = new Set<string>();
  const recentPatterns = new Set<string>();
  const recentClues = new Set<string>();

  previousDates.forEach((previousDate, index) => {
    const previous = localCache.get(previousDate) ?? generatedCache.get(previousDate);

    if (!previous) {
      return;
    }

    if (index < RECENT_SIGNATURE_LOOKBACK) {
      recentSignatures.add(previous.signature);
    }

    if (index < RECENT_WORDSET_LOOKBACK) {
      recentWordSignatures.add(previous.wordSignature);
    }

    if (index < RECENT_PATTERN_LOOKBACK) {
      recentPatterns.add(previous.patternId);
    }

    if (index < 3) {
      previous.clues.forEach((clue) => recentClues.add(clue));
    }
  });

  let fallback: GeneratedMeta | null = null;

  for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
    const attemptSeed = `${dateKey}:${seedSalt}:${attempt}`;
    const orderedPatterns = shuffleWithSeed(PATTERN_TEMPLATES, attemptSeed);

    for (const pattern of orderedPatterns) {
      const candidate = buildPuzzle(
        dateKey,
        pattern,
        `${attemptSeed}:${pattern.id}`
      );

      if (!candidate) {
        continue;
      }

      if (!fallback) {
        fallback = candidate;
      }

      if (recentPatterns.has(candidate.patternId)) {
        continue;
      }

      if (recentSignatures.has(candidate.signature)) {
        continue;
      }

      if (recentWordSignatures.has(candidate.wordSignature)) {
        continue;
      }

      if (candidate.clues.some((clue) => recentClues.has(clue))) {
        continue;
      }

      return candidate;
    }
  }

  if (!fallback) {
    throw new Error(`Unable to generate a puzzle for ${dateKey}`);
  }

  if (requireUniqueClues) {
    return fallback;
  }

  return fallback;
}

function buildWindow(centerDate: string, daysBack = 3) {
  const cacheKey = `${centerDate}:${daysBack}`;
  const existing = WINDOW_CACHE.get(cacheKey);
  if (existing) {
    return existing;
  }

  const windowMap = new Map<string, GeneratedMeta>();
  const dates: string[] = [];

  for (let offset = daysBack; offset >= 0; offset -= 1) {
    dates.push(shiftDate(centerDate, -offset));
  }

  for (let windowAttempt = 0; windowAttempt < WINDOW_RETRY_ATTEMPTS; windowAttempt += 1) {
    windowMap.clear();

    let completed = true;

    for (let index = 0; index < dates.length; index += 1) {
      const currentDate = dates[index];
      const previousDates = dates
        .slice(Math.max(0, index - RECENT_SIGNATURE_LOOKBACK), index)
        .reverse();

      try {
        const generated = generateSingleDate(currentDate, previousDates, windowMap, {
          attemptBudget: STRICT_WINDOW_ATTEMPTS,
          seedSalt: `window:${centerDate}:${windowAttempt}`,
          requireUniqueClues: true,
        });
        windowMap.set(currentDate, generated);
      } catch {
        completed = false;
        break;
      }
    }

    if (completed) {
      for (const [date, generated] of windowMap.entries()) {
        generatedCache.set(date, generated);
      }

      WINDOW_CACHE.set(cacheKey, new Map(windowMap));
      return new Map(windowMap);
    }
  }

  throw new Error(`Unable to generate a non-repeating puzzle window for ${centerDate}`);
}

function resolveDate(dateKey: string): GeneratedMeta {
  const cached = generatedCache.get(dateKey);
  if (cached) {
    return cached;
  }

  const today = getTodayDateKey();
  const fastWindowStart = shiftDate(today, -RECENT_ARCHIVE_LOOKBACK);
  const fastWindowEnd = today;

  if (dateKey >= fastWindowStart && dateKey <= fastWindowEnd) {
    const windowMap = buildWindow(fastWindowEnd, RECENT_ARCHIVE_LOOKBACK);
    const resolved = windowMap.get(dateKey);
    if (resolved) {
      return resolved;
    }
  }

  const previousDates: string[] = [];
  for (let offset = 1; offset <= RECENT_PATTERN_LOOKBACK; offset += 1) {
    const previousDate = shiftDate(dateKey, -offset);
    const existingPrevious = generatedCache.get(previousDate);
    if (existingPrevious) {
      previousDates.push(previousDate);
    }
  }

  const generated = generateSingleDate(dateKey, previousDates, generatedCache);
  generatedCache.set(dateKey, generated);
  return generated;
}

export function getPuzzleForDate(dateKey: string): Puzzle {
  return resolveDate(dateKey).puzzle;
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function getPuzzleArchive(selectedDate: string, days = 10) {
  const today = getTodayDateKey();
  const recentWindow =
    days <= RECENT_ARCHIVE_DAYS
      ? buildWindow(today, Math.min(days - 1, RECENT_ARCHIVE_LOOKBACK))
      : null;

  return Array.from({ length: days }, (_, index) => {
    const date = shiftDate(today, -index);
    const puzzle =
      recentWindow?.get(date)?.puzzle ?? getPuzzleForDate(date);

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
