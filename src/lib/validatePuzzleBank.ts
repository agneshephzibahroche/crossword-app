type RawClue = {
  number: number;
  row: number;
  col: number;
  answer: string;
  clues: string[];
};

type RawPuzzle = {
  id: string;
  date: string;
  title: string;
  rows: number;
  cols: number;
  grid: string[][];
  solution: string[][];
  clues: {
    across: RawClue[];
    down: RawClue[];
  };
};

function getCells(
  clue: RawClue,
  direction: "across" | "down"
): Array<{ row: number; col: number }> {
  return Array.from({ length: clue.answer.length }, (_, i) => ({
    row: direction === "across" ? clue.row : clue.row + i,
    col: direction === "across" ? clue.col + i : clue.col,
  }));
}

export function validatePuzzleBank(bank: RawPuzzle[]) {
  const errors: string[] = [];

  for (const puzzle of bank) {
    const seenAnswers = new Set<string>();

    for (const direction of ["across", "down"] as const) {
      for (const clue of puzzle.clues[direction]) {
        if (!clue.answer || !clue.clues?.length) {
          errors.push(`${puzzle.id}: missing answer/clues for ${direction} ${clue.number}`);
          continue;
        }

        if (seenAnswers.has(clue.answer)) {
          errors.push(`${puzzle.id}: duplicate answer "${clue.answer}"`);
        }
        seenAnswers.add(clue.answer);

        const cells = getCells(clue, direction);

        for (let i = 0; i < cells.length; i++) {
          const { row, col } = cells[i];

          if (
            row < 0 ||
            row >= puzzle.rows ||
            col < 0 ||
            col >= puzzle.cols
          ) {
            errors.push(`${puzzle.id}: ${direction} ${clue.number} goes out of bounds`);
            break;
          }

          if (puzzle.grid[row][col] === "#") {
            errors.push(`${puzzle.id}: ${direction} ${clue.number} runs through black cell`);
            break;
          }

          const expected = clue.answer[i];
          const actual = puzzle.solution[row][col];

          if (actual !== expected) {
            errors.push(
              `${puzzle.id}: ${direction} ${clue.number} mismatch at (${row},${col}) expected "${expected}" got "${actual}"`
            );
          }
        }
      }
    }
  }

  return errors;
}