import { DictionaryEntry } from "@/lib/dictionary";
import { Slot } from "@/lib/findSlots";

function getCellsForSlot(slot: Slot) {
  const cells: { row: number; col: number }[] = [];

  for (let i = 0; i < slot.length; i++) {
    cells.push({
      row: slot.direction === "across" ? slot.row : slot.row + i,
      col: slot.direction === "across" ? slot.col + i : slot.col,
    });
  }

  return cells;
}

function fitsWord(grid: string[][], slot: Slot, word: string) {
  const cells = getCellsForSlot(slot);

  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i];
    const existing = grid[row][col];

    if (existing !== "" && existing !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid: string[][], slot: Slot, word: string) {
  const cells = getCellsForSlot(slot);
  const previous: string[] = [];

  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i];
    previous.push(grid[row][col]);
    grid[row][col] = word[i];
  }

  return previous;
}

function unplaceWord(grid: string[][], slot: Slot, previous: string[]) {
  const cells = getCellsForSlot(slot);

  for (let i = 0; i < cells.length; i++) {
    const { row, col } = cells[i];
    grid[row][col] = previous[i];
  }
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function fillCrossword(
  grid: string[][],
  slots: Slot[],
  dictionary: DictionaryEntry[]
): Map<string, DictionaryEntry> | null {
  const usedWords = new Set<string>();
  const assignment = new Map<string, DictionaryEntry>();

  const orderedSlots = [...slots].sort((a, b) => b.length - a.length);

  function backtrack(index: number): boolean {
    if (index === orderedSlots.length) {
      return true;
    }

    const slot = orderedSlots[index];

    const candidates = shuffleArray(
      dictionary.filter(
        (entry) =>
          entry.word.length === slot.length &&
          !usedWords.has(entry.word) &&
          fitsWord(grid, slot, entry.word)
      )
    );

    for (const entry of candidates) {
      const previous = placeWord(grid, slot, entry.word);
      usedWords.add(entry.word);
      assignment.set(`${slot.row}-${slot.col}-${slot.direction}`, entry);

      if (backtrack(index + 1)) {
        return true;
      }

      unplaceWord(grid, slot, previous);
      usedWords.delete(entry.word);
      assignment.delete(`${slot.row}-${slot.col}-${slot.direction}`);
    }

    return false;
  }

  return backtrack(0) ? assignment : null;
}