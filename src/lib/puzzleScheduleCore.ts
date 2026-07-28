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
};

export const ANCHOR_DATE = "2020-01-01";
export const RECENT_SIGNATURE_LOOKBACK = 24;
export const RECENT_WORDSET_LOOKBACK = 20;
export const RECENT_PATTERN_LOOKBACK = 6;
// These two are bounded by how quickly the *effective* usable word pool
// runs out, which is much smaller than the raw dictionary size: the
// priority formula in getEntryPriority is dominated by quality/familiarity
// (mostly length-based, plus a handful of explicit overrides), so a small
// set of "premium" words gets picked far more often than an even spread
// across the dictionary would suggest. Empirically (see PR discussion): 24
// left the search unable to find even a single word-respecting fill on
// most days, silently forcing the fully-unconstrained fallback below and
// producing exact same-word-next-day repeats. 10 was verified to hold with
// zero repeats under the window across a 300-day simulation.
export const RECENT_CLUE_LOOKBACK = 10;
export const RECENT_ANSWER_LOOKBACK = 10;
const MAX_LOOKBACK = Math.max(
  RECENT_SIGNATURE_LOOKBACK,
  RECENT_WORDSET_LOOKBACK,
  RECENT_PATTERN_LOOKBACK,
  RECENT_CLUE_LOOKBACK,
  RECENT_ANSWER_LOOKBACK
);
export const MAX_ATTEMPTS = 28;
export const STRICT_WINDOW_ATTEMPTS = 24;
export const RECENT_ARCHIVE_DAYS = 3;
export const SCHEDULE_START = "2025-01-01";
export const SCHEDULE_END = "2028-12-31";
const MIN_QUALITY_SCORE = 66;
const MAX_SHORT_FILL = 4;
const MAX_GLUE_WORDS = 2;
// Verified empirically against a 100-day simulation at the lookback values
// above: at 20,000 the search frequently exhausted its budget before
// finding even one word-respecting fill (forcing the fully-unconstrained
// fallback and same-word-next-day repeats); 150,000 eliminated that
// entirely while keeping the average per-day cost close to unchanged (most
// days still succeed well before the ceiling).
const TOTAL_SEARCH_BUDGET_PER_DATE = 150000;

// Every template below is 180°-rotationally symmetric and has no slot
// shorter than 3 letters -- unlike the original set, which leaned on
// 2-letter fill (up to 8 slots per puzzle) drawn from a pool of only ~28
// short glue words (AT, OF, TO, ...). That both made puzzles feel
// repetitive and made the recent-word uniqueness constraint in
// generateSingleDate nearly unsatisfiable after just a few days.
//
// Slot lengths alone don't guarantee a grid is actually fillable: a valid
// symmetric layout can still have crossing constraints with zero
// satisfying assignment for a given (necessarily finite) dictionary. Each
// grid below was picked from a larger set of candidates by brute-force
// verifying it actually fills against DICTIONARY across many seeds
// (see scripts/build-puzzle-schedule.cjs history / PR description for the
// verification approach) -- don't add a new template without doing the
// same check.
// A soft daily theme: getEntryPriority gives words tagged with the day's
// theme a scoring bonus, so they're preferred *when they already fit* a
// slot, without ever excluding non-themed words. This can never make a day
// harder to fill than an untagged one -- worst case, none of the themed
// words happen to cross well and the puzzle just looks like any other day.
const THEMES: { tag: string; label: string }[] = [
  { tag: "pop-culture", label: "🎬 Pop Culture" },
  { tag: "location", label: "🌍 World Traveler" },
  { tag: "food", label: "🍔 Food & Drink" },
  { tag: "nature", label: "🌿 Nature & Wildlife" },
  { tag: "sports", label: "⚽ Sports & Games" },
];

function getTodaysTheme(dateKey: string) {
  return THEMES[hashString(`${dateKey}:theme`) % THEMES.length];
}

const PATTERN_TEMPLATES: PatternTemplate[] = [
  {
    id: "classic",
    title: "Letterbeat",
    grid: [
      ["#", "", "", "", ""],
      ["", "", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", "#"],
    ],
  },
  {
    id: "offset-cross",
    title: "Ribbon Grid",
    grid: [
      ["", "#", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "#", ""],
      ["", "", "", "#", ""],
    ],
  },
  {
    id: "hourglass",
    title: "Spark Grid",
    grid: [
      ["", "", "", "#", ""],
      ["", "", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["", "#", "", "", ""],
    ],
  },
  {
    id: "stagger",
    title: "Pulse Grid",
    grid: [
      ["", "", "", "", "#"],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "#", ""],
      ["#", "", "", "", ""],
    ],
  },
  {
    id: "corners",
    title: "Corner Turn",
    grid: [
      ["", "", "", "", ""],
      ["#", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "#", "#"],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "zigzag",
    title: "Zigzag Grid",
    grid: [
      ["", "", "", "", ""],
      ["", "", "", "#", "#"],
      ["", "", "", "", ""],
      ["#", "#", "", "", ""],
      ["", "", "", "", ""],
    ],
  },
  {
    id: "lanes",
    title: "Lanes Grid",
    grid: [
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
    ],
  },
  {
    id: "drift",
    title: "Drift Grid",
    grid: [
      ["#", "#", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "#", ""],
      ["", "", "", "#", "#"],
    ],
  },
  {
    id: "swing",
    title: "Swing Grid",
    grid: [
      ["#", "", "", "", "#"],
      ["", "", "", "#", ""],
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["#", "", "", "", "#"],
    ],
  },
  {
    id: "scatter",
    title: "Scatter Grid",
    grid: [
      ["#", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", ""],
      ["#", "", "", "", "#"],
      ["", "", "", "", "#"],
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

function getEntryPriority(
  entry: DictionaryEntry,
  seed: string,
  themeTag: string | null
) {
  const baseScore = entry.quality * 100;
  const familiarityBonus = entry.familiarity * 18;
  const lengthBonus = entry.word.length * 6;
  const shortFillPenalty = entry.tags.includes("short-fill") ? -36 : 0;
  const gluePenalty = entry.tags.includes("glue") ? -42 : 0;
  const miniFillPenalty = entry.tags.includes("mini-fill") ? -10 : 0;
  // A soft nudge, not a filter: themed words get a real edge when they're
  // already in the running for a slot, but never exclude non-themed words,
  // so a themed day can never be *harder* to fill than a normal one -- it
  // can only end up with fewer than ideal themed answers if the crossing
  // constraints don't cooperate. (A hard theme requirement was tried and
  // reverted: forcibly restricting slots to a theme's much smaller word
  // pool caused the same kind of solver breakdown as the frequency cap did.)
  // Unlike that cap, this can be tuned aggressively without that risk --
  // it only ever reorders which candidate wins a tie, never removes one,
  // so backtracking still falls through to non-themed words when a themed
  // one doesn't cross well. 80 (comparable to one familiarity point) barely
  // moved the needle empirically: ~0.7 themed answers/day, many days with
  // zero. 600 (bigger than the entire quality range) means a themed word
  // wins against literally any non-themed word of the same length whenever
  // it's a valid candidate at all.
  const themeBonus = themeTag && entry.tags.includes(themeTag) ? 600 : 0;
  const tieBreaker = hashString(`${seed}:${entry.word}`) % 17;

  return (
    baseScore +
    familiarityBonus +
    lengthBonus +
    shortFillPenalty +
    gluePenalty +
    miniFillPenalty +
    themeBonus +
    tieBreaker
  );
}

function sortCandidates(
  candidates: DictionaryEntry[],
  seed: string,
  themeTag: string | null
) {
  // Priority only depends on the (entry, seed, themeTag) triple, so compute
  // it once per candidate instead of recomputing it (with its hashString
  // call) on every comparison a sort makes -- for a length-5 bucket of 200+
  // words that's the difference between O(n) and O(n log n) hashString
  // calls.
  return candidates
    .map((entry) => ({
      entry,
      priority: getEntryPriority(entry, seed, themeTag),
    }))
    .sort((left, right) => right.priority - left.priority)
    .map(({ entry }) => entry);
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

// fitsWord runs once per candidate word considered at every search step, so
// it dominates total allocation pressure -- these three helpers index the
// grid directly instead of building an array of {row, col} cell objects.
function fitsWord(grid: string[][], slot: Slot, word: string) {
  const isAcross = slot.direction === "across";

  for (let index = 0; index < slot.length; index += 1) {
    const row = isAcross ? slot.row : slot.row + index;
    const col = isAcross ? slot.col + index : slot.col;
    const existing = grid[row][col];

    if (existing !== "" && existing !== word[index]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid: string[][], slot: Slot, word: string) {
  const isAcross = slot.direction === "across";
  const previous: string[] = new Array(slot.length);

  for (let index = 0; index < slot.length; index += 1) {
    const row = isAcross ? slot.row : slot.row + index;
    const col = isAcross ? slot.col + index : slot.col;
    previous[index] = grid[row][col];
    grid[row][col] = word[index];
  }

  return previous;
}

function restoreWord(grid: string[][], slot: Slot, previous: string[]) {
  const isAcross = slot.direction === "across";

  for (let index = 0; index < slot.length; index += 1) {
    const row = isAcross ? slot.row : slot.row + index;
    const col = isAcross ? slot.col + index : slot.col;
    grid[row][col] = previous[index];
  }
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
  forbiddenWords: Set<string>,
  forbiddenClues: Set<string>,
  seed: string,
  themeTag: string | null
) {
  let bestSlot: Slot | null = null;
  let bestCandidates: DictionaryEntry[] = [];

  for (const slot of slots) {
    const candidates = (DICTIONARY_BY_LENGTH.get(slot.length) ?? []).filter(
      (entry) =>
        entry.allowInDaily &&
        !usedWords.has(entry.word) &&
        !forbiddenWords.has(entry.word) &&
        !entry.clues.every((clue) => forbiddenClues.has(clue)) &&
        fitsWord(grid, slot, entry.word)
    );

    if (candidates.length === 0) {
      return { slot, candidates };
    }

    if (!bestSlot || candidates.length < bestCandidates.length) {
      bestSlot = slot;
      bestCandidates = sortCandidates(
        candidates,
        `${seed}:${slot.row}:${slot.col}:${slot.direction}`,
        themeTag
      );
    }
  }

  return {
    slot: bestSlot,
    candidates: bestCandidates,
  };
}

// A dense 5x5 grid with few blocks creates a tightly-crossed constraint
// problem: naive backtracking can take exponential time to prove a branch
// is a dead end, especially once popular words are excluded by the recency
// filters. Rather than trying to make the search provably fast for every
// grid/dictionary combination, every fill attempt draws from a shared step
// budget for the whole date -- once it runs out, every remaining
// attempt/pattern combination bails immediately instead of hanging, and
// generateSingleDate falls back to its best candidate so far.
type SearchBudget = { remaining: number };

function fillGrid(
  grid: string[][],
  slots: Slot[],
  forbiddenWords: Set<string>,
  forbiddenClues: Set<string>,
  seed: string,
  budget: SearchBudget,
  themeTag: string | null
) {
  const assignment = new Map<string, DictionaryEntry>();
  const usedWords = new Set<string>();

  function backtrack(remaining: Slot[]): boolean {
    if (remaining.length === 0) {
      return true;
    }

    budget.remaining -= 1;
    if (budget.remaining <= 0) {
      return false;
    }

    const { slot, candidates } = selectSlots(
      remaining,
      grid,
      usedWords,
      forbiddenWords,
      forbiddenClues,
      seed,
      themeTag
    );

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

      if (budget.remaining <= 0) {
        break;
      }
    }

    return false;
  }

  if (budget.remaining <= 0 || !backtrack(slots)) {
    return null;
  }

  return assignment;
}

function buildPuzzle(
  dateKey: string,
  pattern: PatternTemplate,
  seed: string,
  forbiddenWords: Set<string>,
  forbiddenClues: Set<string>,
  budget: SearchBudget,
  theme: { tag: string; label: string }
) {
  const grid = cloneGrid(pattern.grid);
  const solution = cloneGrid(pattern.grid);
  const slots = PATTERN_SLOTS.get(pattern.id) ?? findSlots(pattern.grid);
  const assignment = fillGrid(
    solution,
    slots,
    forbiddenWords,
    forbiddenClues,
    seed,
    budget,
    theme.tag
  );

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
      theme: { label: theme.label },
    },
  } satisfies GeneratedMeta;
}

export function generateSingleDate(
  dateKey: string,
  previousDates: string[],
  localCache: Map<string, GeneratedMeta>,
  options: GenerateOptions = {}
) {
  const { attemptBudget = MAX_ATTEMPTS, seedSalt = "" } = options;
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

  // Not every date can find a candidate that satisfies every constraint (grid
  // pattern unused recently, quality above the bar, etc.), so we keep the
  // best candidate seen at each tier and settle for the best available
  // rather than the first successful fill, in priority order:
  //   1. a "perfect" candidate (returned immediately below)
  //   2. nonDuplicateCandidate: respects recentAnswers/recentClues (no
  //      individual word/clue reused too soon) AND isn't an exact repeat
  //      of a recent whole puzzle
  //   3. anyCandidate: respects recentAnswers/recentClues, but may repeat
  //      a whole recent puzzle
  //   4. the unconstrained search below, which ignores recentAnswers/
  //      recentClues entirely -- only reached if even anyCandidate is
  //      unavailable
  // Reusing one individual word/clue too soon (tier 3) is a smaller,
  // easy-to-miss regression -- one repeated answer among ten -- while an
  // exact whole-puzzle repeat (tier 4 without this ordering) is obvious to
  // any player, so tier 3 must be preferred over reaching for tier 4.
  let anyCandidate: GeneratedMeta | null = null;
  let nonDuplicateCandidate: GeneratedMeta | null = null;
  const isDuplicate = (candidate: GeneratedMeta) =>
    recentSignatures.has(candidate.signature) ||
    recentWordSignatures.has(candidate.wordSignature);
  const budget: SearchBudget = { remaining: TOTAL_SEARCH_BUDGET_PER_DATE };
  const theme = getTodaysTheme(dateKey);

  attempts: for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
    const attemptSeed = `${dateKey}:${seedSalt}:${attempt}`;
    const orderedPatterns =
      attempt === 0
        ? getPreferredPatternOrder(dateKey, seedSalt)
        : shuffleWithSeed(PATTERN_TEMPLATES, attemptSeed);

    for (const pattern of orderedPatterns) {
      if (budget.remaining <= 0) {
        break attempts;
      }

      const candidate = buildPuzzle(
        dateKey,
        pattern,
        `${attemptSeed}:${pattern.id}`,
        recentAnswers,
        recentClues,
        budget,
        theme
      );

      if (!candidate) {
        continue;
      }

      if (!anyCandidate) {
        anyCandidate = candidate;
      }

      if (!nonDuplicateCandidate && !isDuplicate(candidate)) {
        nonDuplicateCandidate = candidate;
      }

      if (recentPatterns.has(candidate.patternId) || isDuplicate(candidate)) {
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

  if (!anyCandidate) {
    // The word-level-constrained search (respecting recentAnswers/
    // recentClues) couldn't produce a single fill at all for this date.
    // Fall back to an unconstrained fill, with a much larger budget, so a
    // puzzle is always produced. This must only trigger when anyCandidate
    // is missing, not merely nonDuplicateCandidate -- if a word-respecting
    // fill already exists, prefer it (even if it happens to repeat a whole
    // recent puzzle) over one that freely reuses recent individual words.
    // An earlier version of this check used `!nonDuplicateCandidate`, which
    // meant reaching for a word-repeating fill was preferred over reusing an
    // already-available word-safe one -- e.g. reusing the exact word "ARE"
    // with the exact same clue on consecutive days.
    const unconstrainedBudget: SearchBudget = {
      remaining: TOTAL_SEARCH_BUDGET_PER_DATE * 10,
    };
    const unconstrainedPatternOrder = shuffleWithSeed(
      PATTERN_TEMPLATES,
      `${dateKey}:${seedSalt}:unconstrained-order`
    );

    for (const pattern of unconstrainedPatternOrder) {
      if (unconstrainedBudget.remaining <= 0) {
        break;
      }

      const candidate = buildPuzzle(
        dateKey,
        pattern,
        `${dateKey}:${seedSalt}:unconstrained:${pattern.id}`,
        new Set(),
        new Set(),
        unconstrainedBudget,
        theme
      );

      if (!candidate) {
        continue;
      }

      if (!anyCandidate) {
        anyCandidate = candidate;
      }

      if (!isDuplicate(candidate)) {
        nonDuplicateCandidate = candidate;
        break;
      }
    }
  }

  const result = nonDuplicateCandidate ?? anyCandidate;

  if (!result) {
    throw new Error(`Unable to generate a puzzle for ${dateKey}`);
  }

  return result;
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
      .slice(Math.max(0, index - MAX_LOOKBACK), index)
      .reverse();

    const generated = generateSingleDate(currentDate, previousDates, schedule, {
      attemptBudget: STRICT_WINDOW_ATTEMPTS,
      seedSalt: `schedule:${startDate}:${endDate}`,
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
    });

    localCache.set(currentDate, generated);
  }

  return localCache;
}
