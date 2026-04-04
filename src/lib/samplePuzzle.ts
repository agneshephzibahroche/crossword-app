import { Puzzle } from "@/types/puzzle";

export const samplePuzzle: Puzzle = {
  id: "sample-puzzle",
  date: "2026-03-22",
  title: "mini crossword",
  rows: 5,
  cols: 5,
  grid: [
    ["C", "A", "T", "#", "S"],
    ["A", "#", "R", "A", "N"],
    ["R", "A", "I", "N", "Y"],
    ["#", "T", "E", "A", "#"],
    ["S", "U", "N", "#", "Y"],
  ],
  solution: [
    ["C", "A", "T", "#", "S"],
    ["A", "#", "R", "A", "N"],
    ["R", "A", "I", "N", "Y"],
    ["#", "T", "E", "A", "#"],
    ["S", "U", "N", "#", "Y"],
  ],
  clues: {
    across: [
      { number: 1, row: 0, col: 0, clue: "Common pet", answer: "CAT" },
      { number: 4, row: 0, col: 4, clue: "Plural marker", answer: "S" },
      { number: 5, row: 1, col: 2, clue: "Moved quickly", answer: "RAN" },
      { number: 6, row: 2, col: 0, clue: "Wet weather", answer: "RAINY" },
      { number: 7, row: 3, col: 1, clue: "Hot drink", answer: "TEA" },
      { number: 8, row: 4, col: 0, clue: "Daylight star", answer: "SUN" },
      { number: 9, row: 4, col: 4, clue: "Sometimes a vowel", answer: "Y" },
    ],
    down: [
      { number: 1, row: 0, col: 0, clue: "Motor vehicle", answer: "CAR" },
      { number: 2, row: 0, col: 1, clue: "First letter", answer: "A" },
      { number: 3, row: 0, col: 2, clue: "Opposite of wrong", answer: "TRIEN".slice(0, 5) },
      { number: 4, row: 0, col: 4, clue: "Affirmative vibe", answer: "SNY".slice(0, 3) },
    ],
  },
};
