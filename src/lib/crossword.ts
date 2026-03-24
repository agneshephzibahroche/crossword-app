import { Direction, Puzzle } from "@/types/puzzle";

export function getWordCells(
  puzzle: Puzzle,
  row: number,
  col: number,
  direction: Direction
) {
  if (puzzle.grid[row][col] === "#") return [];

  let startRow = row;
  let startCol = col;

  if (direction === "across") {
    while (startCol > 0 && puzzle.grid[startRow][startCol - 1] !== "#") {
      startCol--;
    }

    const cells: { row: number; col: number }[] = [];
    let c = startCol;

    while (c < puzzle.cols && puzzle.grid[startRow][c] !== "#") {
      cells.push({ row: startRow, col: c });
      c++;
    }

    return cells;
  }

  while (startRow > 0 && puzzle.grid[startRow - 1][startCol] !== "#") {
    startRow--;
  }

  const cells: { row: number; col: number }[] = [];
  let r = startRow;

  while (r < puzzle.rows && puzzle.grid[r][startCol] !== "#") {
    cells.push({ row: r, col: startCol });
    r++;
  }

  return cells;
}

export function getCellNumber(puzzle: Puzzle, row: number, col: number) {
  if (puzzle.grid[row][col] === "#") return null;

  const startsAcross =
    col === 0 || puzzle.grid[row][col - 1] === "#";

  const startsDown =
    row === 0 || puzzle.grid[row - 1][col] === "#";

  if (!startsAcross && !startsDown) return null;

  const matchingAcross = puzzle.clues.across.find(
    (clue) => clue.row === row && clue.col === col
  );
  if (matchingAcross) return matchingAcross.number;

  const matchingDown = puzzle.clues.down.find(
    (clue) => clue.row === row && clue.col === col
  );
  if (matchingDown) return matchingDown.number;

  return null;
}