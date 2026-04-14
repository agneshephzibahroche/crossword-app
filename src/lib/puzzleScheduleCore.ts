import { DICTIONARY, DictionaryEntry, getEntryClue } from "./dictionary";
import { findSlots, Slot } from "./findSlots";
import type { Puzzle } from "../types/puzzle";

type PatternTemplate = {
  id: string;
  title: string;
  grid: string[][];
};

export type GeneratedMeta = {
  patternId: string;
  signature: string;
  wordSignature: string;
  clues: string[];
  answers: string[];
  qualityScore: number;
  shortFillCount: number;
  glueCount: number;
  puzzle: Puzzle;
};

type GenerateOptions = {
  attemptBudget?: number;
  seedSalt?: string;
  requireUniqueClues?: boolean;
};

export const ANCHOR_DATE = "2020-01-01";
export const RECENT_SIGNATURE_LOOKBACK = 24;
export const RECENT_WORDSET_LOOKBACK = 20;
export const RECENT_PATTERN_LOOKBACK = 6;
export const RECENT_CLUE_LOOKBACK = 28;
export const RECENT_ANSWER_LOOKBACK = 35;
export const MAX_ATTEMPTS = 28;
export const STRICT_WINDOW_ATTEMPTS = 24;
export const RECENT_ARCHIVE_DAYS = 3;
export const SCHEDULE_START = "2025-01-01";
export const SCHEDULE_END = "2028-12-31";
const MIN_QUALITY_SCORE = 66;
const MAX_SHORT_FILL = 4;
const MAX_GLUE_WORDS = 2;

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
    id: "offset-cross",
    title: "Ribbon Grid",
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "#", ""],
      ["", "", "", "", "#"],
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
    id: "stagger",
    title: "Pulse Grid",
    grid: [
      ["", "", "", "", ""],
      ["#", "", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "", "#"],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "corners",
    title: "Corner Turn",
    grid: [
      ["", "", "", "#", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "#", ""],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "zigzag",
    title: "Zigzag Grid",
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", "#"],
      ["#", "", "", "", ""],
      ["", "", "", "", "#"],
      ["", "", "#", "", ""],
    ],
  },
  {
    id: "lanes",
    title: "Lanes Grid",
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "#", ""],
      ["", "", "", "", ""],
      ["", "", "#", "", ""],
    ],
  },
  {
    id: "drift",
    title: "Drift Grid",
    grid: [
      ["", "", "", "", "#"],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["#", "", "", "#", ""],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "swing",
    title: "Swing Grid",
    grid: [
      ["", "", "#", "", ""],
      ["", "", "", "", ""],
      ["", "#", "", "", "#"],
      ["", "", "", "", ""],
      ["#", "", "", "", ""],
    ],
  },
  {
    id: "scatter",
    title: "Scatter Grid",
    grid: [
      ["", "", "", "", ""],
      ["#", "", "", "", ""],
      ["", "", "#", "", ""],
      ["", "", "", "", "#"],
      ["", "", "", "", ""],
    ],
  },
];

const DICTIONARY_BY_LENGTH = new Map<number, DictionaryEntry[]>();
const PATTERN_SLOTS = new Map<string, Slot[]>();

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
  const familiarityBonus = entry.familiarity * 18;
  const lengthBonus = entry.word.length * 6;
  const shortFillPenalty = entry.tags.includes("short-fill") ? -36 : 0;
  const gluePenalty = entry.tags.includes("glue") ? -42 : 0;
  const miniFillPenalty = entry.tags.includes("mini-fill") ? -10 : 0;
  const tieBreaker = hashString(`${seed}:${entry.word}`) % 17;

  return (
    baseScore +
    familiarityBonus +
    lengthBonus +
    shortFillPenalty +
    gluePenalty +
    miniFillPenalty +
    tieBreaker
  );
}

function sortCandidates(candidates: DictionaryEntry[], seed: string) {
  return [...candidates].sort(
    (left, right) =>
      getEntryPriority(right, seed) - getEntryPriority(left, seed)
  );
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftDate(dateKey: string, amount: number) {
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

function getPreferredPatternOrder(dateKey: string, seedSalt: string) {
  const baseIndex = hashString(`${dateKey}:${seedSalt}:pattern`) % PATTERN_TEMPLATES.length;
  const rotated = Array.from({ length: PATTERN_TEMPLATES.length }, (_, index) => {
    return PATTERN_TEMPLATES[(baseIndex + index) % PATTERN_TEMPLATES.length];
  });

  const leadPatternId = PATTERN_TEMPLATES[baseIndex]?.id;
  const shuffledTail = shuffleWithSeed(
    rotated.slice(1),
    `${dateKey}:${seedSalt}:tail`
  );

  return [
    rotated[0],
    ...shuffledTail.filter((pattern) => pattern.id !== leadPatternId),
  ];
}

function selectSlots(
  slots: Slot[],
  grid: string[][],
  usedWords: Set<string>,
  seed: string
) {
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

    const nextRemaining = remaining.filter(
      (candidateSlot) => candidateSlot !== slot
    );

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
  const assignedEntries = [...assignment.values()];
  const wordSignature = assignedEntries
    .map((entry) => entry.word)
    .sort()
    .join("|");
  const answers = assignedEntries.map((entry) => entry.word);
  const clueList = [...across, ...down].map((entry) => entry.clue);
  const shortFillCount = assignedEntries.filter((entry) =>
    entry.tags.includes("short-fill")
  ).length;
  const glueCount = assignedEntries.filter((entry) =>
    entry.tags.includes("glue")
  ).length;
  const qualityScore = Math.round(
    (assignedEntries.reduce(
      (sum, entry) =>
        sum +
        entry.quality * 7 +
        entry.familiarity * 5 -
        (entry.tags.includes("short-fill") ? 8 : 0) -
        (entry.tags.includes("glue") ? 12 : 0),
      0
    ) /
      Math.max(assignedEntries.length, 1)) *
      10
  ) / 10;

  return {
    patternId: pattern.id,
    signature,
    wordSignature,
    clues: clueList,
    answers,
    qualityScore,
    shortFillCount,
    glueCount,
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
  } satisfies GeneratedMeta;
}

export function generateSingleDate(
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
  const recentAnswers = new Set<string>();

  previousDates.forEach((previousDate, index) => {
    const previous = localCache.get(previousDate);

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

    if (index < RECENT_CLUE_LOOKBACK) {
      previous.clues.forEach((clue) => recentClues.add(clue));
    }

    if (index < RECENT_ANSWER_LOOKBACK) {
      previous.answers.forEach((answer) => recentAnswers.add(answer));
    }
  });

  let fallback: GeneratedMeta | null = null;

  for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
    const attemptSeed = `${dateKey}:${seedSalt}:${attempt}`;
    const orderedPatterns =
      attempt === 0
        ? getPreferredPatternOrder(dateKey, seedSalt)
        : shuffleWithSeed(PATTERN_TEMPLATES, attemptSeed);

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

      if (candidate.answers.some((answer) => recentAnswers.has(answer))) {
        continue;
      }

      if (
        candidate.qualityScore < MIN_QUALITY_SCORE ||
        candidate.shortFillCount > MAX_SHORT_FILL ||
        candidate.glueCount > MAX_GLUE_WORDS
      ) {
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

export function buildPrecomputedSchedule(startDate: string, endDate: string) {
  const schedule = new Map<string, GeneratedMeta>();
  const dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = shiftDate(cursor, 1);
  }

  for (let index = 0; index < dates.length; index += 1) {
    const currentDate = dates[index];
    const previousDates = dates
      .slice(Math.max(0, index - RECENT_SIGNATURE_LOOKBACK), index)
      .reverse();

    const generated = generateSingleDate(currentDate, previousDates, schedule, {
      attemptBudget: STRICT_WINDOW_ATTEMPTS,
      seedSalt: `schedule:${startDate}:${endDate}`,
      requireUniqueClues: true,
    });

    schedule.set(currentDate, generated);
  }

  return schedule;
}

export function buildSerializedSchedule(startDate: string, endDate: string) {
  return Object.fromEntries(
    Array.from(buildPrecomputedSchedule(startDate, endDate).entries()).map(
      ([date, generated]) => [date, generated.puzzle]
    )
  ) as Record<string, Puzzle>;
}

export function generateFallbackPuzzle(dateKey: string) {
  const generated = generateSingleDate(dateKey, [], new Map(), {
    attemptBudget: MAX_ATTEMPTS,
    seedSalt: "fallback",
  });

  return generated.puzzle;
}

export function generateRecentWindow(dateKeys: string[]) {
  const localCache = new Map<string, GeneratedMeta>();

  for (let index = 0; index < dateKeys.length; index += 1) {
    const currentDate = dateKeys[index];
    const previousDates = dateKeys.slice(0, index).reverse();
    const generated = generateSingleDate(currentDate, previousDates, localCache, {
      attemptBudget: STRICT_WINDOW_ATTEMPTS,
      seedSalt: `recent-window:${dateKeys.join("|")}`,
      requireUniqueClues: true,
    });

    localCache.set(currentDate, generated);
  }

  return localCache;
}
