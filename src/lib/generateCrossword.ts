import { Puzzle } from "@/types/puzzle";
import { PUZZLE_BANK } from "@/lib/puzzleBank";

export function generateCrossword(): Puzzle {
  const randomIndex = Math.floor(Math.random() * PUZZLE_BANK.length);
  const basePuzzle = PUZZLE_BANK[randomIndex];

  return {
    ...basePuzzle,
    id: crypto.randomUUID(),
    date: new Date().toISOString().slice(0, 10),
  };
}