export function generateGridPattern(size = 5, blackSquareChance = 0.1): string[][] {
  const grid = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "")
  );

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (Math.random() < blackSquareChance) {
        grid[r][c] = "#";
      }
    }
  }

  // keep corners open to improve chances
  grid[0][0] = "";
  grid[0][size - 1] = "";
  grid[size - 1][0] = "";
  grid[size - 1][size - 1] = "";

  return grid;
}