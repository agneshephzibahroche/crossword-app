export type Direction = "across" | "down";

export interface Clue {
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export interface Puzzle {
  date: string;
  title: string;
  rows: number;
  cols: number;
  grid: string[][];
  clues: {
    across: Clue[];
    down: Clue[];
  };
}