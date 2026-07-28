export type Direction = "across" | "down";

export interface Clue {
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export interface PuzzleEntry {
  answer: string;
  clues: string[];
}

export interface PuzzleTheme {
  label: string;
}

export interface Puzzle {
  id: string;
  date: string;
  title: string;
  rows: number;
  cols: number;
  grid: string[][];
  solution: string[][];
  clues: {
    across: Clue[];
    down: Clue[];
  };
  // A soft daily theme -- some of the fill was nudged toward this category,
  // but it's never guaranteed since the nudge yields to grid crossing
  // constraints. Absent for puzzles generated before this feature existed.
  theme?: PuzzleTheme;
}
