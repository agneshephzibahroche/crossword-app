import { Puzzle } from "@/types/puzzle";
import { PUZZLE_BANK } from "@/lib/puzzleBank";
import { validatePuzzleBank } from "@/lib/validatePuzzleBank";

function pickUniqueClue(clues: string[], usedClues: Set<string>): string {
  for (const clue of clues) {
    if (!usedClues.has(clue)) {
      usedClues.add(clue);
      return clue;
    }
  }

  const fallback = clues[0] ?? "Clue";
  usedClues.add(fallback);
  return fallback;
}

function processClues(puzzle: any): Puzzle {
  const usedClues = new Set<string>();

  const process = (clues: any[]) =>
    clues.map((c) => ({
      number: c.number,
      row: c.row,
      col: c.col,
      answer: c.answer,
      clue: pickUniqueClue(c.clues, usedClues),
    }));

  return {
    ...puzzle,
    clues: {
      across: process(puzzle.clues.across),
      down: process(puzzle.clues.down),
    },
  };
}

export function generateCrossword(): Puzzle {
  const errors = validatePuzzleBank(PUZZLE_BANK as any);
  if (errors.length > 0) {
    throw new Error(`Puzzle bank invalid:\n${errors.join("\n")}`);
  }

  const randomIndex = Math.floor(Math.random() * PUZZLE_BANK.length);
  const basePuzzle = PUZZLE_BANK[randomIndex];
  const processed = processClues(basePuzzle);

  return {
    ...processed,
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
  };
}