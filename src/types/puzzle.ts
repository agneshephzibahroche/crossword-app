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
}