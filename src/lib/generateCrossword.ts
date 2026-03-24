import { randomUUID } from "crypto";
import { DICTIONARY } from "@/lib/dictionary";
import { fillCrossword } from "@/lib/fillCrossword";
import { findSlots } from "@/lib/findSlots";
import { GRID_TEMPLATES_5X5 } from "@/lib/gridTemplates";
import { Puzzle } from "@/types/puzzle";

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function templateToGrid(template: string[][]): string[][] {
  return template.map((row) =>
    row.map((cell) => (cell === "#" ? "#" : ""))
  );
}

type AssignedEntry = {
  word: string;
  clue: string;
};

function buildClues(
  slots: Array<{
    number: number;
    row: number;
    col: number;
    direction: "across" | "down";
    length: number;
  }>,
  assignment: Map<string, AssignedEntry>
) {
  const across: Puzzle["clues"]["across"] = [];
  const down: Puzzle["clues"]["down"] = [];

  for (const slot of slots) {
    const key = `${slot.row}-${slot.col}-${slot.direction}`;
    const entry = assignment.get(key);

    if (!entry) continue;

    const clue = {
      number: slot.number,
      row: slot.row,
      col: slot.col,
      clue: entry.clue,
      answer: entry.word,
    };

    if (slot.direction === "across") {
      across.push(clue);
    } else {
      down.push(clue);
    }
  }

  return { across, down };
}

export function generateCrossword(): Puzzle {
  const templates = shuffleArray(GRID_TEMPLATES_5X5);

  for (const template of templates) {
    const layoutGrid = templateToGrid(template);
    const slots = findSlots(layoutGrid);

    const solutionGrid = layoutGrid.map((row) => [...row]);
    const assignment = fillCrossword(solutionGrid, slots, DICTIONARY);

    if (!assignment) continue;

    const { across, down } = buildClues(slots, assignment);

    // Reject weak puzzles
    if (across.length + down.length < 3) {
      continue;
    }

    return {
      id: randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      title: "Generated Crossword",
      rows: 5,
      cols: 5,
      grid: layoutGrid,
      solution: solutionGrid,
      clues: {
        across,
        down,
      },
    };
  }

  return {
    id: randomUUID(),
    date: new Date().toISOString().slice(0, 10),
    title: "Fallback Mini",
    rows: 5,
    cols: 5,
    grid: [
      ["", "", "", "", ""],
      ["", "#", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
      ["", "", "", "", ""],
    ],
    solution: [
      ["E", "A", "R", "T", "H"],
      ["A", "#", "", "", ""],
      ["R", "", "", "", ""],
      ["T", "", "", "", ""],
      ["H", "", "", "", ""],
    ],
    clues: {
      across: [
        {
          number: 1,
          row: 0,
          col: 0,
          clue: "The planet we live on",
          answer: "EARTH",
        },
      ],
      down: [
        {
          number: 1,
          row: 0,
          col: 0,
          clue: "Fallback clue",
          answer: "EARTH",
        },
      ],
    },
  };
}