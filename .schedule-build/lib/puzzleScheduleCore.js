"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEDULE_END = exports.SCHEDULE_START = exports.RECENT_ARCHIVE_DAYS = exports.STRICT_WINDOW_ATTEMPTS = exports.MAX_ATTEMPTS = exports.RECENT_ANSWER_LOOKBACK = exports.RECENT_CLUE_LOOKBACK = exports.RECENT_PATTERN_LOOKBACK = exports.RECENT_WORDSET_LOOKBACK = exports.RECENT_SIGNATURE_LOOKBACK = exports.ANCHOR_DATE = void 0;
exports.toDateKey = toDateKey;
exports.shiftDate = shiftDate;
exports.generateSingleDate = generateSingleDate;
exports.buildPrecomputedSchedule = buildPrecomputedSchedule;
exports.buildSerializedSchedule = buildSerializedSchedule;
exports.generateFallbackPuzzle = generateFallbackPuzzle;
exports.generateRecentWindow = generateRecentWindow;
const dictionary_1 = require("./dictionary");
const findSlots_1 = require("./findSlots");
exports.ANCHOR_DATE = "2020-01-01";
exports.RECENT_SIGNATURE_LOOKBACK = 24;
exports.RECENT_WORDSET_LOOKBACK = 20;
exports.RECENT_PATTERN_LOOKBACK = 6;
exports.RECENT_CLUE_LOOKBACK = 28;
exports.RECENT_ANSWER_LOOKBACK = 35;
exports.MAX_ATTEMPTS = 56;
exports.STRICT_WINDOW_ATTEMPTS = 48;
exports.RECENT_ARCHIVE_DAYS = 3;
exports.SCHEDULE_START = "2025-01-01";
exports.SCHEDULE_END = "2028-12-31";
const MIN_QUALITY_SCORE = 66;
const MAX_SHORT_FILL = 4;
const MAX_GLUE_WORDS = 2;
const PATTERN_TEMPLATES = [
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
];
const DICTIONARY_BY_LENGTH = new Map();
const PATTERN_SLOTS = new Map();
for (const entry of dictionary_1.DICTIONARY) {
    const existing = DICTIONARY_BY_LENGTH.get(entry.word.length) ?? [];
    existing.push(entry);
    DICTIONARY_BY_LENGTH.set(entry.word.length, existing);
}
for (const pattern of PATTERN_TEMPLATES) {
    PATTERN_SLOTS.set(pattern.id, (0, findSlots_1.findSlots)(pattern.grid));
}
function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
function createSeededRandom(seed) {
    let state = hashString(seed) || 1;
    return () => {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        return state / 4294967296;
    };
}
function shuffleWithSeed(items, seed) {
    const random = createSeededRandom(seed);
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}
function getEntryPriority(entry, seed) {
    const baseScore = entry.quality * 100;
    const familiarityBonus = entry.familiarity * 18;
    const lengthBonus = entry.word.length * 6;
    const shortFillPenalty = entry.tags.includes("short-fill") ? -36 : 0;
    const gluePenalty = entry.tags.includes("glue") ? -42 : 0;
    const miniFillPenalty = entry.tags.includes("mini-fill") ? -10 : 0;
    const tieBreaker = hashString(`${seed}:${entry.word}`) % 17;
    return (baseScore +
        familiarityBonus +
        lengthBonus +
        shortFillPenalty +
        gluePenalty +
        miniFillPenalty +
        tieBreaker);
}
function sortCandidates(candidates, seed) {
    return [...candidates].sort((left, right) => getEntryPriority(right, seed) - getEntryPriority(left, seed));
}
function toDateKey(date) {
    return date.toISOString().slice(0, 10);
}
function shiftDate(dateKey, amount) {
    const date = new Date(`${dateKey}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return toDateKey(date);
}
function cloneGrid(grid) {
    return grid.map((row) => [...row]);
}
function getSlotKey(slot) {
    return `${slot.row}-${slot.col}-${slot.direction}`;
}
function getCellsForSlot(slot) {
    return Array.from({ length: slot.length }, (_, index) => ({
        row: slot.direction === "across" ? slot.row : slot.row + index,
        col: slot.direction === "across" ? slot.col + index : slot.col,
    }));
}
function fitsWord(grid, slot, word) {
    const cells = getCellsForSlot(slot);
    return cells.every(({ row, col }, index) => {
        const existing = grid[row][col];
        return existing === "" || existing === word[index];
    });
}
function placeWord(grid, slot, word) {
    const cells = getCellsForSlot(slot);
    const previous = cells.map(({ row, col }) => grid[row][col]);
    cells.forEach(({ row, col }, index) => {
        grid[row][col] = word[index];
    });
    return previous;
}
function restoreWord(grid, slot, previous) {
    const cells = getCellsForSlot(slot);
    cells.forEach(({ row, col }, index) => {
        grid[row][col] = previous[index];
    });
}
function getPreferredPatternOrder(dateKey, seedSalt) {
    const baseIndex = hashString(`${dateKey}:${seedSalt}:pattern`) % PATTERN_TEMPLATES.length;
    const rotated = Array.from({ length: PATTERN_TEMPLATES.length }, (_, index) => {
        return PATTERN_TEMPLATES[(baseIndex + index) % PATTERN_TEMPLATES.length];
    });
    const leadPatternId = PATTERN_TEMPLATES[baseIndex]?.id;
    const shuffledTail = shuffleWithSeed(rotated.slice(1), `${dateKey}:${seedSalt}:tail`);
    return [
        rotated[0],
        ...shuffledTail.filter((pattern) => pattern.id !== leadPatternId),
    ];
}
function selectSlots(slots, grid, usedWords, seed) {
    let bestSlot = null;
    let bestCandidates = [];
    for (const slot of slots) {
        const candidates = (DICTIONARY_BY_LENGTH.get(slot.length) ?? []).filter((entry) => entry.allowInDaily &&
            !usedWords.has(entry.word) &&
            fitsWord(grid, slot, entry.word));
        if (candidates.length === 0) {
            return { slot, candidates };
        }
        if (!bestSlot || candidates.length < bestCandidates.length) {
            bestSlot = slot;
            bestCandidates = sortCandidates(shuffleWithSeed(candidates, `${seed}:${slot.row}:${slot.col}:${slot.direction}`), `${seed}:${slot.row}:${slot.col}:${slot.direction}`);
        }
    }
    return {
        slot: bestSlot,
        candidates: bestCandidates,
    };
}
function fillGrid(grid, slots, seed) {
    const assignment = new Map();
    const usedWords = new Set();
    function backtrack(remaining) {
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
function buildPuzzle(dateKey, pattern, seed) {
    const grid = cloneGrid(pattern.grid);
    const solution = cloneGrid(pattern.grid);
    const slots = PATTERN_SLOTS.get(pattern.id) ?? (0, findSlots_1.findSlots)(pattern.grid);
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
            clue: (0, dictionary_1.getEntryClue)(entry, `${dateKey}:${slot.number}:across`),
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
            clue: (0, dictionary_1.getEntryClue)(entry, `${dateKey}:${slot.number}:down`),
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
    const shortFillCount = assignedEntries.filter((entry) => entry.tags.includes("short-fill")).length;
    const glueCount = assignedEntries.filter((entry) => entry.tags.includes("glue")).length;
    const qualityScore = Math.round((assignedEntries.reduce((sum, entry) => sum +
        entry.quality * 7 +
        entry.familiarity * 5 -
        (entry.tags.includes("short-fill") ? 8 : 0) -
        (entry.tags.includes("glue") ? 12 : 0), 0) /
        Math.max(assignedEntries.length, 1)) *
        10) / 10;
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
    };
}
function generateSingleDate(dateKey, previousDates, localCache, options = {}) {
    const { attemptBudget = exports.MAX_ATTEMPTS, seedSalt = "", requireUniqueClues = false, } = options;
    const recentSignatures = new Set();
    const recentWordSignatures = new Set();
    const recentPatterns = new Set();
    const recentClues = new Set();
    const recentAnswers = new Set();
    previousDates.forEach((previousDate, index) => {
        const previous = localCache.get(previousDate);
        if (!previous) {
            return;
        }
        if (index < exports.RECENT_SIGNATURE_LOOKBACK) {
            recentSignatures.add(previous.signature);
        }
        if (index < exports.RECENT_WORDSET_LOOKBACK) {
            recentWordSignatures.add(previous.wordSignature);
        }
        if (index < exports.RECENT_PATTERN_LOOKBACK) {
            recentPatterns.add(previous.patternId);
        }
        if (index < exports.RECENT_CLUE_LOOKBACK) {
            previous.clues.forEach((clue) => recentClues.add(clue));
        }
        if (index < exports.RECENT_ANSWER_LOOKBACK) {
            previous.answers.forEach((answer) => recentAnswers.add(answer));
        }
    });
    let fallback = null;
    for (let attempt = 0; attempt < attemptBudget; attempt += 1) {
        const attemptSeed = `${dateKey}:${seedSalt}:${attempt}`;
        const orderedPatterns = attempt === 0
            ? getPreferredPatternOrder(dateKey, seedSalt)
            : shuffleWithSeed(PATTERN_TEMPLATES, attemptSeed);
        for (const pattern of orderedPatterns) {
            const candidate = buildPuzzle(dateKey, pattern, `${attemptSeed}:${pattern.id}`);
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
            if (candidate.qualityScore < MIN_QUALITY_SCORE ||
                candidate.shortFillCount > MAX_SHORT_FILL ||
                candidate.glueCount > MAX_GLUE_WORDS) {
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
function buildPrecomputedSchedule(startDate, endDate) {
    const schedule = new Map();
    const dates = [];
    let cursor = startDate;
    while (cursor <= endDate) {
        dates.push(cursor);
        cursor = shiftDate(cursor, 1);
    }
    for (let index = 0; index < dates.length; index += 1) {
        const currentDate = dates[index];
        const previousDates = dates
            .slice(Math.max(0, index - exports.RECENT_SIGNATURE_LOOKBACK), index)
            .reverse();
        const generated = generateSingleDate(currentDate, previousDates, schedule, {
            attemptBudget: exports.STRICT_WINDOW_ATTEMPTS,
            seedSalt: `schedule:${startDate}:${endDate}`,
            requireUniqueClues: true,
        });
        schedule.set(currentDate, generated);
    }
    return schedule;
}
function buildSerializedSchedule(startDate, endDate) {
    return Object.fromEntries(Array.from(buildPrecomputedSchedule(startDate, endDate).entries()).map(([date, generated]) => [date, generated.puzzle]));
}
function generateFallbackPuzzle(dateKey) {
    const generated = generateSingleDate(dateKey, [], new Map(), {
        attemptBudget: exports.MAX_ATTEMPTS,
        seedSalt: "fallback",
    });
    return generated.puzzle;
}
function generateRecentWindow(dateKeys) {
    const localCache = new Map();
    for (let index = 0; index < dateKeys.length; index += 1) {
        const currentDate = dateKeys[index];
        const previousDates = dateKeys.slice(0, index).reverse();
        const generated = generateSingleDate(currentDate, previousDates, localCache, {
            attemptBudget: exports.STRICT_WINDOW_ATTEMPTS,
            seedSalt: `recent-window:${dateKeys.join("|")}`,
            requireUniqueClues: true,
        });
        localCache.set(currentDate, generated);
    }
    return localCache;
}
