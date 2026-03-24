import { WORDS } from "./wordList";

function getRandomWord(length: number) {
  const filtered = WORDS.filter(w => w.length === length);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function generateMiniCrossword() {
  const size = 5;

  // empty grid
  const grid: string[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "")
  );

  // simple layout:
  // row 0 → across word (5 letters)
  // col 0 → down word (5 letters)

  const acrossWord = getRandomWord(5);
  const downWord = getRandomWord(5);

  if (!acrossWord || !downWord) {
    throw new Error("Not enough words");
  }

  // place across word
  for (let c = 0; c < 5; c++) {
    grid[0][c] = acrossWord[c];
  }

  // place down word
  for (let r = 0; r < 5; r++) {
    grid[r][0] = downWord[r];
  }

  // fill rest randomly (simple version)
  for (let r = 1; r < 5; r++) {
    for (let c = 1; c < 5; c++) {
      grid[r][c] = "";
    }
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    title: "Generated Mini",
    rows: 5,
    cols: 5,
    grid,
    clues: {
      across: [
        { number: 1, row: 0, col: 0, clue: `Word: ${acrossWord}`, answer: acrossWord }
      ],
      down: [
        { number: 1, row: 0, col: 0, clue: `Word: ${downWord}`, answer: downWord }
      ]
    }
  };
}