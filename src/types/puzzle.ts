export type Direction = "across" | "down";

export interface Clue {
  number: number;
  row: number;
  col: number;
  clue: string;
  answer: string;
}

export interface Puzzle {
  id: string;
  date: string;
  title: string;
  rows: number;
  cols: number;

  // layout only: "#" for black squares, "" for open cells
  grid: string[][];

  // full answer key
  solution: string[][];

  clues: {
    across: Clue[];
    down: Clue[];
  };
}