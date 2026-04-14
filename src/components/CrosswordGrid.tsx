"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import ClueList from "@/components/ClueList";
import { getCellNumber, getWordCells } from "@/lib/crossword";
import { Direction, Puzzle } from "@/types/puzzle";

type Props = {
  immediateChecks?: boolean;
  puzzle: Puzzle;
};

type CrosswordStats = {
  solvedDates: string[];
  completedWithRevealsDates: string[];
  bestTimeSeconds: number | null;
  cleanSolveTimesByDate: Record<string, number>;
};

type StoredProgress = {
  grid: string[][];
  elapsedSeconds: number;
  startedAtMs?: number | null;
};

const STATS_KEY = "crossword-daily-stats-v1";
const ARCHIVE_EVENT = "letterbeat-archive-change";

function getWordKey(row: number, col: number, wordDirection: Direction) {
  return `${row}-${col}-${wordDirection}`;
}

function computeCorrectWords(
  puzzle: Puzzle,
  gridToCheck: string[][],
  revealedCells: Set<string>
) {
  const next = new Set<string>();
  const allClues = [
    ...puzzle.clues.across.map((clue) => ({
      ...clue,
      direction: "across" as const,
    })),
    ...puzzle.clues.down.map((clue) => ({
      ...clue,
      direction: "down" as const,
    })),
  ];

  for (const clue of allClues) {
    const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
    const hasRevealedCell = cells.some((cell) =>
      revealedCells.has(`${cell.row}-${cell.col}`)
    );
    const isWordCorrect = cells.every(
      (cell) => gridToCheck[cell.row][cell.col] === puzzle.solution[cell.row][cell.col]
    );

    if (isWordCorrect && !hasRevealedCell) {
      next.add(getWordKey(clue.row, clue.col, clue.direction));
    }
  }

  return next;
}

function computeCheckedCells(puzzle: Puzzle, gridToCheck: string[][]) {
  const correct = new Set<string>();
  const wrong = new Set<string>();
  const allClues = [
    ...puzzle.clues.across.map((clue) => ({
      row: clue.row,
      col: clue.col,
      direction: "across" as const,
    })),
    ...puzzle.clues.down.map((clue) => ({
      row: clue.row,
      col: clue.col,
      direction: "down" as const,
    })),
  ];

  for (const clue of allClues) {
    const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
    const isFilledWord = cells.every(
      (cell) => gridToCheck[cell.row][cell.col] !== ""
    );

    if (!isFilledWord) {
      continue;
    }

    const isCorrectWord = cells.every(
      (cell) => gridToCheck[cell.row][cell.col] === puzzle.solution[cell.row][cell.col]
    );

    for (const cell of cells) {
      const key = `${cell.row}-${cell.col}`;
      if (isCorrectWord) {
        wrong.delete(key);
        correct.add(key);
      } else if (!correct.has(key)) {
        wrong.add(key);
      }
    }
  }

  return { correct, wrong };
}

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function readStoredStats(): CrosswordStats {
  if (typeof window === "undefined") {
    return {
      solvedDates: [],
      completedWithRevealsDates: [],
      bestTimeSeconds: null,
      cleanSolveTimesByDate: {},
    };
  }

  const raw = localStorage.getItem(STATS_KEY);

  if (!raw) {
    return {
      solvedDates: [],
      completedWithRevealsDates: [],
      bestTimeSeconds: null,
      cleanSolveTimesByDate: {},
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CrosswordStats>;
    const cleanSolveTimesByDate =
      parsed.cleanSolveTimesByDate &&
      typeof parsed.cleanSolveTimesByDate === "object"
        ? Object.fromEntries(
            Object.entries(parsed.cleanSolveTimesByDate).filter(
              ([key, value]) => key && typeof value === "number"
            )
          )
        : {};

    return {
      solvedDates: Array.isArray(parsed.solvedDates) ? parsed.solvedDates : [],
      completedWithRevealsDates: Array.isArray(
        parsed.completedWithRevealsDates
      )
        ? parsed.completedWithRevealsDates
        : [],
      bestTimeSeconds:
        typeof parsed.bestTimeSeconds === "number" &&
        parsed.bestTimeSeconds > 0
          ? parsed.bestTimeSeconds
          : null,
      cleanSolveTimesByDate,
    };
  } catch {
    return {
      solvedDates: [],
      completedWithRevealsDates: [],
      bestTimeSeconds: null,
      cleanSolveTimesByDate: {},
    };
  }
}

function readStoredProgress(
  storageKey: string,
  emptyGrid: string[][],
  rows: number,
  cols: number
): StoredProgress {
  if (typeof window === "undefined") {
    return {
      grid: emptyGrid,
      elapsedSeconds: 0,
    };
  }

  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return {
      grid: emptyGrid,
      elapsedSeconds: 0,
    };
  }

  try {
    const parsed = JSON.parse(saved);
    const parsedGrid =
      Array.isArray(parsed)
        ? parsed
        : parsed &&
            typeof parsed === "object" &&
            Array.isArray(parsed.grid)
          ? parsed.grid
          : null;
    const parsedElapsedSeconds =
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.elapsedSeconds === "number" &&
      parsed.elapsedSeconds >= 0
        ? parsed.elapsedSeconds
        : 0;
    const parsedStartedAtMs =
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.startedAtMs === "number" &&
      Number.isFinite(parsed.startedAtMs)
        ? parsed.startedAtMs
        : null;

    if (
      Array.isArray(parsedGrid) &&
      parsedGrid.length === rows &&
      parsedGrid.every(
        (row: unknown) => Array.isArray(row) && row.length === cols
      )
    ) {
      return {
        grid: parsedGrid as string[][],
        elapsedSeconds: parsedElapsedSeconds,
        startedAtMs: parsedStartedAtMs,
      };
    }
  } catch {
    // fall through to defaults
  }

  return {
    grid: emptyGrid,
    elapsedSeconds: 0,
    startedAtMs: null,
  };
}

export default function CrosswordGrid({
  immediateChecks = false,
  puzzle,
}: Props) {
  const cellInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const boardSectionRef = useRef<HTMLDivElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);
  const hasRecordedCompletionRef = useRef(false);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [direction, setDirection] = useState<Direction>("across");
  const [usesTouchKeyboard, setUsesTouchKeyboard] = useState(false);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [completionDismissed, setCompletionDismissed] = useState(false);
  const [shareState, setShareState] = useState<
    "idle" | "copied" | "failed" | "shared"
  >("idle");
  const [shareFallbackText, setShareFallbackText] = useState<string | null>(null);

  const storageKey = `daily-crossword-progress-${puzzle.id}`;
  const emptyGrid = useMemo(
    () => puzzle.grid.map((row) => row.map((cell) => (cell === "#" ? "#" : ""))),
    [puzzle.grid]
  );
  const [userGrid, setUserGrid] = useState<string[][]>(emptyGrid);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const updateTouchKeyboard = () => {
      setUsesTouchKeyboard(mediaQuery.matches);
    };

    updateTouchKeyboard();
    mediaQuery.addEventListener("change", updateTouchKeyboard);

    return () => {
      mediaQuery.removeEventListener("change", updateTouchKeyboard);
    };
  }, []);

  useEffect(() => {
    const restored = readStoredProgress(
      storageKey,
      emptyGrid,
      puzzle.rows,
      puzzle.cols
    );

    setUserGrid(restored.grid);
    setElapsedSeconds(restored.elapsedSeconds);
    setStartedAtMs(restored.startedAtMs ?? Date.now());
    setWrongCells(new Set());
    setCorrectCells(new Set());
    setRevealedCells(new Set());
    setRevealedWords(new Set());
    setCompletionDismissed(false);
    hasRecordedCompletionRef.current = false;
    setSelectedRow(0);
    setSelectedCol(0);
    setDirection("across");
  }, [emptyGrid, puzzle.cols, puzzle.rows, storageKey]);

  const correctWords = useMemo(
    () => computeCorrectWords(puzzle, userGrid, revealedCells),
    [puzzle, revealedCells, userGrid]
  );

  useEffect(() => {
    const nextProgress: StoredProgress = {
      grid: userGrid,
      elapsedSeconds,
      startedAtMs,
    };
    localStorage.setItem(storageKey, JSON.stringify(nextProgress));
    window.dispatchEvent(new Event(ARCHIVE_EVENT));
  }, [elapsedSeconds, startedAtMs, storageKey, userGrid]);

  const immediateCheckResult = useMemo(() => {
    if (!immediateChecks) {
      return null;
    }

    return computeCheckedCells(puzzle, userGrid);
  }, [immediateChecks, puzzle, userGrid]);

  const activeCorrectCells =
    immediateCheckResult?.correct ?? correctCells;
  const activeWrongCells =
    immediateCheckResult?.wrong ?? wrongCells;

  const isBlackCell = useCallback(
    (row: number, col: number) => puzzle.grid[row][col] === "#",
    [puzzle.grid]
  );

  const moveSelection = useCallback(
    (row: number, col: number) => {
      if (
        row >= 0 &&
        row < puzzle.rows &&
        col >= 0 &&
        col < puzzle.cols &&
        !isBlackCell(row, col)
      ) {
        setSelectedRow(row);
        setSelectedCol(col);
      }
    },
    [isBlackCell, puzzle.cols, puzzle.rows]
  );

  const focusCell = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    window.requestAnimationFrame(() => {
      cellInputRefs.current[key]?.focus();
      cellInputRefs.current[key]?.select();
    });
  }, []);

  const focusActiveInput = useCallback(
    (row: number, col: number) => {
      if (usesTouchKeyboard) {
        mobileInputRef.current?.focus();
        mobileInputRef.current?.setSelectionRange?.(
          0,
          mobileInputRef.current.value.length
        );
        return;
      }

      focusCell(row, col);
    },
    [focusCell, usesTouchKeyboard]
  );

  function handleCellClick(row: number, col: number) {
    if (isBlackCell(row, col)) return;

    if (selectedRow === row && selectedCol === col) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
      focusActiveInput(row, col);
      return;
    }

    setSelectedRow(row);
    setSelectedCol(col);
    focusActiveInput(row, col);
  }

  function handleSelectClue(
    row: number,
    col: number,
    nextDirection: Direction
  ) {
    const targetCell =
      findNextEditableCellInWord(row, col, nextDirection, true) ?? { row, col };

    setSelectedRow(targetCell.row);
    setSelectedCol(targetCell.col);
    setDirection(nextDirection);

    if (usesTouchKeyboard) {
      boardSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      mobileInputRef.current?.focus();
      window.setTimeout(() => {
        mobileInputRef.current?.focus();
      }, 160);
    }

    focusActiveInput(targetCell.row, targetCell.col);
  }

  function clearCheckedCell(row: number, col: number) {
    const key = `${row}-${col}`;

    setWrongCells((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    setCorrectCells((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function clearRevealedCell(row: number, col: number) {
    const key = `${row}-${col}`;

    setRevealedCells((prev) => {
      if (!prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function clearRevealedWord(row: number, col: number, wordDirection: Direction) {
    const key = getWordKey(row, col, wordDirection);

    setRevealedWords((prev) => {
      if (!prev.has(key)) {
        return prev;
      }

      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleCheckAnswers() {
    const { correct, wrong } = computeCheckedCells(puzzle, userGrid);
    setWrongCells(wrong);
    setCorrectCells(correct);
  }

  function clearGrid() {
    setUserGrid(emptyGrid);
    setWrongCells(new Set());
    setCorrectCells(new Set());
    setRevealedCells(new Set());
    setRevealedWords(new Set());
    setElapsedSeconds(0);
    setStartedAtMs(Date.now());
    setCompletionDismissed(false);
    hasRecordedCompletionRef.current = false;
  }

  function handleRevealLetter() {
    if (isBlackCell(selectedRow, selectedCol)) {
      return;
    }

    const cellKey = `${selectedRow}-${selectedCol}`;
    const nextRevealedCells = new Set(revealedCells);
    nextRevealedCells.add(cellKey);

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[selectedRow][selectedCol] = puzzle.solution[selectedRow][selectedCol];
      return next;
    });

    setRevealedCells(nextRevealedCells);

    setWrongCells((prev) => {
      const next = new Set(prev);
      next.delete(cellKey);
      return next;
    });

    setCorrectCells((prev) => {
      const next = new Set(prev);
      next.delete(cellKey);
      return next;
    });
  }

  function handleRevealWord() {
    const cells = getWordCells(puzzle, selectedRow, selectedCol, direction);
    if (cells.length === 0) return;

    const nextRevealedCells = new Set(revealedCells);
    for (const cell of cells) {
      nextRevealedCells.add(`${cell.row}-${cell.col}`);
    }

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);

      for (const cell of cells) {
        next[cell.row][cell.col] = puzzle.solution[cell.row][cell.col];
      }
      return next;
    });

    setRevealedCells(nextRevealedCells);

    setRevealedWords((prev) => {
      const next = new Set(prev);
      next.add(getWordKey(cells[0].row, cells[0].col, direction));
      return next;
    });

    setWrongCells((prev) => {
      const next = new Set(prev);
      for (const cell of cells) {
        next.delete(`${cell.row}-${cell.col}`);
      }
      return next;
    });

    setCorrectCells((prev) => {
      const next = new Set(prev);
      for (const cell of cells) {
        next.delete(`${cell.row}-${cell.col}`);
      }
      return next;
    });
  }

  const activeWordCells = useMemo(
    () => getWordCells(puzzle, selectedRow, selectedCol, direction),
    [direction, puzzle, selectedCol, selectedRow]
  );

  const activeWordSet = useMemo(
    () => new Set(activeWordCells.map((cell) => `${cell.row}-${cell.col}`)),
    [activeWordCells]
  );

  const findNextEditableCellInWord = useCallback(
    (
      row: number,
      col: number,
      wordDirection: Direction,
      includeCurrent = false
    ) => {
      const cells = getWordCells(puzzle, row, col, wordDirection);
      if (cells.length === 0) {
        return null;
      }

      const selectedIndex = cells.findIndex(
        (cell) => cell.row === row && cell.col === col
      );
      const startIndex = selectedIndex >= 0 ? selectedIndex : 0;
      const orderedCells = [
        ...cells.slice(includeCurrent ? startIndex : startIndex + 1),
        ...cells.slice(0, includeCurrent ? startIndex : startIndex + 1),
      ];

      return (
        orderedCells.find((cell) => {
          const key = `${cell.row}-${cell.col}`;
          return (
            !revealedCells.has(key) &&
            !(immediateChecks && activeCorrectCells.has(key))
          );
        }) ?? null
      );
    },
    [activeCorrectCells, immediateChecks, puzzle, revealedCells]
  );

  const completedCellSet = useMemo(() => {
    const visibleCompletedWords = new Set<string>();
    const allClues = [
      ...puzzle.clues.across.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "across" as const,
      })),
      ...puzzle.clues.down.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "down" as const,
      })),
    ];

    for (const clue of allClues) {
      const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
      const hasRevealedCell = cells.some((cell) =>
        revealedCells.has(`${cell.row}-${cell.col}`)
      );

      const isVisiblyComplete = cells.every((cell) =>
        activeCorrectCells.has(`${cell.row}-${cell.col}`)
      );

      if (
        !hasRevealedCell &&
        (immediateChecks ? correctWords.has(getWordKey(clue.row, clue.col, clue.direction)) : isVisiblyComplete)
      ) {
        visibleCompletedWords.add(
          getWordKey(clue.row, clue.col, clue.direction)
        );
      }
    }

    const next = new Set<string>();

    for (const clue of allClues) {
      const key = getWordKey(clue.row, clue.col, clue.direction);
      if (!visibleCompletedWords.has(key)) {
        continue;
      }

      const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
      for (const cell of cells) {
        next.add(`${cell.row}-${cell.col}`);
      }
    }

    return next;
  }, [activeCorrectCells, correctWords, immediateChecks, puzzle, revealedCells]);

  const visibleCompletedWords = useMemo(() => {
    const next = new Set<string>();
    const allClues = [
      ...puzzle.clues.across.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "across" as const,
      })),
      ...puzzle.clues.down.map((clue) => ({
        row: clue.row,
        col: clue.col,
        direction: "down" as const,
      })),
    ];

    for (const clue of allClues) {
      const cells = getWordCells(puzzle, clue.row, clue.col, clue.direction);
      const hasRevealedCell = cells.some((cell) =>
        revealedCells.has(`${cell.row}-${cell.col}`)
      );
      const key = getWordKey(clue.row, clue.col, clue.direction);

      if (hasRevealedCell) {
        continue;
      }

      if (immediateChecks) {
        if (correctWords.has(key)) {
          next.add(key);
        }
        continue;
      }

      const isVisiblyComplete = cells.every((cell) =>
        activeCorrectCells.has(`${cell.row}-${cell.col}`)
      );

      if (isVisiblyComplete) {
        next.add(key);
      }
    }

    return next;
  }, [activeCorrectCells, correctWords, immediateChecks, puzzle, revealedCells]);

  const isComplete = useMemo(() => {
    if (puzzle.clues.across.length + puzzle.clues.down.length === 0) {
      return false;
    }

    for (let row = 0; row < puzzle.rows; row += 1) {
      for (let col = 0; col < puzzle.cols; col += 1) {
        if (puzzle.grid[row][col] === "#") continue;

        if (userGrid[row][col] !== puzzle.solution[row][col]) {
          return false;
        }
      }
    }

    return true;
  }, [puzzle, userGrid]);

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (isComplete || isBlackCell(selectedRow, selectedCol)) {
        return;
      }

      if (immediateChecks && activeCorrectCells.has(`${selectedRow}-${selectedCol}`)) {
        const nextEditableCell = findNextEditableCellInWord(
          selectedRow,
          selectedCol,
          direction
        );
        if (nextEditableCell) {
          moveSelection(nextEditableCell.row, nextEditableCell.col);
          focusActiveInput(nextEditableCell.row, nextEditableCell.col);
        }
        return;
      }

      if (revealedCells.has(`${selectedRow}-${selectedCol}`)) {
        return;
      }

      setUserGrid((prev) => {
        const next = prev.map((row) => [...row]);
        next[selectedRow][selectedCol] = letter;
        return next;
      });

      if (!immediateChecks) {
        clearCheckedCell(selectedRow, selectedCol);
      }
      clearRevealedCell(selectedRow, selectedCol);
      clearRevealedWord(selectedRow, selectedCol, direction);

      const nextEditableCell = findNextEditableCellInWord(
        selectedRow,
        selectedCol,
        direction
      );

      if (nextEditableCell) {
        moveSelection(nextEditableCell.row, nextEditableCell.col);
        focusActiveInput(nextEditableCell.row, nextEditableCell.col);
      } else if (direction === "across") {
        moveSelection(selectedRow, selectedCol + 1);
        focusActiveInput(selectedRow, selectedCol + 1);
      } else {
        moveSelection(selectedRow + 1, selectedCol);
        focusActiveInput(selectedRow + 1, selectedCol);
      }
    },
    [
      direction,
      activeCorrectCells,
      findNextEditableCellInWord,
      focusActiveInput,
      isBlackCell,
      moveSelection,
      revealedCells,
      selectedCol,
      selectedRow,
      isComplete,
      immediateChecks,
    ]
  );

  const handleKeyInput = useCallback(
    (event: { key: string; preventDefault: () => void }, row: number, col: number) => {
      setSelectedRow(row);
      setSelectedCol(col);

      if (isComplete || isBlackCell(row, col)) {
        return;
      }

      if (/^[a-zA-Z]$/.test(event.key)) {
        event.preventDefault();
        handleLetterInput(event.key.toUpperCase());
        return;
      }

      if (event.key === "Backspace") {
        event.preventDefault();

        if (immediateChecks && activeCorrectCells.has(`${row}-${col}`)) {
          const nextEditableCell = findNextEditableCellInWord(
            row,
            col,
            direction
          );
          if (nextEditableCell) {
            moveSelection(nextEditableCell.row, nextEditableCell.col);
            focusActiveInput(nextEditableCell.row, nextEditableCell.col);
          }
          return;
        }

        if (revealedCells.has(`${row}-${col}`)) {
          return;
        }

        if (userGrid[row][col]) {
          setUserGrid((prev) => {
            const next = prev.map((row) => [...row]);
            next[row][col] = "";
            return next;
          });
        } else if (direction === "across") {
          moveSelection(row, col - 1);
          focusActiveInput(row, col - 1);
        } else {
          moveSelection(row - 1, col);
          focusActiveInput(row - 1, col);
        }

        clearCheckedCell(row, col);
        clearRevealedCell(row, col);
        clearRevealedWord(row, col, direction);
        return;
      }

      if (event.key === " " || event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        setDirection((prev) => (prev === "across" ? "down" : "across"));
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        moveSelection(row, col + 1);
        focusActiveInput(row, col + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        moveSelection(row, col - 1);
        focusActiveInput(row, col - 1);
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        moveSelection(row + 1, col);
        focusActiveInput(row + 1, col);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        moveSelection(row - 1, col);
        focusActiveInput(row - 1, col);
      }
    },
    [
      direction,
      activeCorrectCells,
      findNextEditableCellInWord,
      focusActiveInput,
      handleLetterInput,
      immediateChecks,
      isBlackCell,
      isComplete,
      moveSelection,
      revealedCells,
      userGrid,
    ]
  );

  const handleCellInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>, row: number, col: number) => {
      const letter = event.currentTarget.value.slice(-1).toUpperCase();
      setSelectedRow(row);
      setSelectedCol(col);

      if (/^[A-Z]$/.test(letter)) {
        handleLetterInput(letter);
        return;
      }

      if (letter === "") {
        if (immediateChecks && activeCorrectCells.has(`${row}-${col}`)) {
          return;
        }

        setUserGrid((prev) => {
          const next = prev.map((currentRow) => [...currentRow]);
          next[row][col] = "";
          return next;
        });
        clearCheckedCell(row, col);
      }
    },
    [activeCorrectCells, handleLetterInput, immediateChecks]
  );

  const handleMobileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value.toUpperCase();
      const letter = value.slice(-1).replace(/[^A-Z]/g, "");

      if (letter) {
        handleLetterInput(letter);
      }

      event.currentTarget.value = "";
    },
    [handleLetterInput]
  );

  const showWinModal = isComplete && !completionDismissed;
  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        id: index,
        left: `${4 + ((index * 11) % 92)}%`,
        delay: `${(index % 6) * 0.12}s`,
        duration: `${2.4 + (index % 5) * 0.28}s`,
        rotation: `${((index * 37) % 70) - 35}deg`,
        color: [
          "#ff6b6b",
          "#ffb347",
          "#ffd93d",
          "#6bcB77",
          "#4d96ff",
          "#ff8fab",
        ][index % 6],
      })),
    []
  );

  useEffect(() => {
    if (isComplete || startedAtMs === null) return;

    const id = window.setInterval(() => {
      const nextElapsed = Math.max(
        0,
        Math.floor((Date.now() - startedAtMs) / 1000)
      );
      setElapsedSeconds((prev) => (prev === nextElapsed ? prev : nextElapsed));
    }, 1000);

    return () => window.clearInterval(id);
  }, [isComplete, startedAtMs]);

  useEffect(() => {
    if (!isComplete || hasRecordedCompletionRef.current) return;

    hasRecordedCompletionRef.current = true;

    const stats = readStoredStats();
    const hasReveals = revealedCells.size > 0;
    const cleanSolveTimesByDate = { ...stats.cleanSolveTimesByDate };
    const completedWithRevealsDates = hasReveals
      ? stats.solvedDates.includes(puzzle.date)
        ? stats.completedWithRevealsDates.filter((date) => date !== puzzle.date)
        : Array.from(
            new Set([...stats.completedWithRevealsDates, puzzle.date])
          ).sort()
      : stats.completedWithRevealsDates.filter((date) => date !== puzzle.date);

    const solvedDates = hasReveals
      ? stats.solvedDates
      : stats.solvedDates.includes(puzzle.date)
        ? stats.solvedDates
        : [...stats.solvedDates, puzzle.date].sort();

    if (!hasReveals) {
      cleanSolveTimesByDate[puzzle.date] =
        typeof cleanSolveTimesByDate[puzzle.date] === "number"
          ? Math.min(cleanSolveTimesByDate[puzzle.date], elapsedSeconds)
          : elapsedSeconds;
    }

    const bestTimeCandidates = Object.values(cleanSolveTimesByDate);
    const nextStats: CrosswordStats = {
      solvedDates,
      completedWithRevealsDates,
      bestTimeSeconds:
        bestTimeCandidates.length > 0 ? Math.min(...bestTimeCandidates) : null,
      cleanSolveTimesByDate,
    };

    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
    window.dispatchEvent(new Event(ARCHIVE_EVENT));
  }, [elapsedSeconds, isComplete, puzzle.date, revealedCells.size]);

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function buildShareGridSafe() {
    const blackSquare = "\u2B1B";
    const revealedSquare = "\uD83D\uDFE8";
    const solvedSquare = "\uD83D\uDFE9";

    return puzzle.grid
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            if (cell === "#") {
              return blackSquare;
            }

            if (revealedCells.has(`${rowIndex}-${colIndex}`)) {
              return revealedSquare;
            }

            return solvedSquare;
          })
          .join("")
      )
      .join("\n");
  }

  function buildShareLines() {
    return puzzle.grid.map((row, rowIndex) =>
      row
        .map((cell, colIndex) => {
          if (cell === "#") {
            return "\u2B1B";
          }

          if (revealedCells.has(`${rowIndex}-${colIndex}`)) {
            return "\uD83D\uDFE8";
          }

          return "\uD83D\uDFE9";
        })
        .join("")
    );
  }

  // Legacy helper kept temporarily while cleaning old encoded source text.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function buildShareGrid() {
    return puzzle.grid
      .map((row, rowIndex) =>
        row
          .map((cell, colIndex) => {
            if (cell === "#") {
              return "⬛";
            }

            if (revealedCells.has(`${rowIndex}-${colIndex}`)) {
              return "🟨";
            }

            return "🟩";
          })
          .join("")
      )
      .join("\n");
  }

  async function handleShareResult() {
    const text = [
      `Letterbeat ${puzzle.date}`,
      `Solved in ${formatTime(elapsedSeconds)}`,
      buildShareGridSafe(),
    ].join("\n");

    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        await navigator.share({
          title: `Letterbeat ${puzzle.date}`,
          text,
        });
        setShareState("shared");
        window.setTimeout(() => setShareState("idle"), 1800);
        return;
      }

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API unavailable");
      }

      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1800);
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!copied) {
          throw new Error("execCommand copy failed");
        }

        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 1800);
      } catch {
        setShareState("failed");
        setShareFallbackText(text);
        window.setTimeout(() => setShareState("idle"), 2200);
      }
    }
  }

  async function handleCopyResult() {
    const text = [
      `Letterbeat ${puzzle.date}`,
      `Solved in ${formatTime(elapsedSeconds)}`,
      buildShareGridSafe(),
    ].join("\n");

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(text);
        setShareFallbackText(null);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 1800);
        return;
      }

      throw new Error("Clipboard API unavailable");
    } catch {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        textArea.style.pointerEvents = "none";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!copied) {
          throw new Error("execCommand copy failed");
        }

        setShareFallbackText(null);
        setShareState("copied");
        window.setTimeout(() => setShareState("idle"), 1800);
      } catch {
        setShareState("failed");
        setShareFallbackText(text);
        window.setTimeout(() => setShareState("idle"), 2200);
      }
    }
  }

  async function handleInstagramStoryExport() {
    const width = 1080;
    const height = 1920;
    const centerX = width / 2;
    const editorialFont =
      "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", \"Libre Baskerville\", Georgia, serif";
    const uiFont = "\"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      setShareState("failed");
      return;
    }

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#fff3e2");
    gradient.addColorStop(0.42, "#ffd8cf");
    gradient.addColorStop(0.78, "#ff9d8d");
    gradient.addColorStop(1, "#221b4d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(255,255,255,0.18)";
    context.beginPath();
    context.arc(170, 210, 180, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(127,50,86,0.15)";
    context.beginPath();
    context.arc(915, 1520, 260, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(255,255,255,0.22)";
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(140, 320);
    context.bezierCurveTo(360, 260, 700, 420, 920, 360);
    context.stroke();

    context.beginPath();
    context.moveTo(180, 1540);
    context.bezierCurveTo(420, 1490, 690, 1580, 920, 1510);
    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.78)";
    context.beginPath();
    context.roundRect(72, 96, width - 144, height - 192, 52);
    context.fill();

    context.fillStyle = "rgba(32,21,71,0.08)";
    context.beginPath();
    context.roundRect(92, 122, width - 184, height - 244, 46);
    context.fill();

    context.fillStyle = "rgba(255,255,255,0.9)";
    context.beginPath();
    context.roundRect(72, 96, width - 144, height - 192, 52);
    context.fill();

    const cardGradient = context.createLinearGradient(72, 96, width - 72, height - 96);
    cardGradient.addColorStop(0, "rgba(255,255,255,0.94)");
    cardGradient.addColorStop(0.55, "rgba(255,248,243,0.94)");
    cardGradient.addColorStop(1, "rgba(255,238,246,0.9)");
    context.fillStyle = cardGradient;
    context.beginPath();
    context.roundRect(72, 96, width - 144, height - 192, 52);
    context.fill();

    context.strokeStyle = "rgba(255,255,255,0.5)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(72, 96, width - 144, height - 192, 52);
    context.stroke();

    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(255,255,255,0.9)";
    context.beginPath();
    context.roundRect(centerX - 120, 146, 240, 46, 999);
    context.fill();
    context.fillStyle = "#7f3256";
    context.font = `700 18px ${uiFont}`;
    context.fillText("DAILY MINI CROSSWORD", centerX, 176);

    context.fillStyle = "rgba(127,50,86,0.08)";
    context.font = `700 190px ${editorialFont}`;
    context.fillText("LB", centerX, 324);

    [
      { x: 215, y: 285, size: 8, color: "rgba(255,132,118,0.8)" },
      { x: 865, y: 305, size: 7, color: "rgba(127,50,86,0.45)" },
      { x: 242, y: 1180, size: 7, color: "rgba(255,132,118,0.62)" },
      { x: 838, y: 1160, size: 8, color: "rgba(127,50,86,0.38)" },
    ].forEach((spark) => {
      context.fillStyle = spark.color;
      context.beginPath();
      context.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
      context.fill();
    });

    context.strokeStyle = "rgba(127,50,86,0.16)";
    context.lineWidth = 2;
    [
      { x: 190, y: 350 },
      { x: 905, y: 265 },
      { x: 175, y: 1120 },
      { x: 888, y: 1240 },
    ].forEach((spark) => {
      context.beginPath();
      context.moveTo(spark.x - 12, spark.y);
      context.lineTo(spark.x + 12, spark.y);
      context.moveTo(spark.x, spark.y - 12);
      context.lineTo(spark.x, spark.y + 12);
      context.stroke();
    });

    context.fillStyle = "#7f3256";
    context.font = `800 92px ${uiFont}`;
    context.fillText("LETTERBEAT", centerX, 240);

    context.fillStyle = "#4a426a";
    context.font = `700 48px ${uiFont}`;
    context.fillText(puzzle.date, centerX, 412);

    const chipY = 480;
    const chipHeight = 60;
    const chipWidth = 170;
    const chipGap = 20;
    const chipGroupWidth = chipWidth * 2 + chipGap;
    const leftChipX = centerX - chipGroupWidth / 2;
    const rightChipX = leftChipX + chipWidth + chipGap;

    context.fillStyle = "rgba(255,215,223,0.92)";
    context.beginPath();
    context.roundRect(leftChipX, chipY, chipWidth, chipHeight, 999);
    context.fill();
    context.fillStyle = "#7f3256";
    context.font = `700 28px ${uiFont}`;
    context.fillText(
      `Time ${formatTime(elapsedSeconds)}`,
      leftChipX + chipWidth / 2,
      chipY + 31
    );

    context.fillStyle = hasReveals ? "rgba(255,225,143,0.92)" : "rgba(208,247,237,0.96)";
    context.beginPath();
    context.roundRect(rightChipX, chipY, chipWidth, chipHeight, 999);
    context.fill();
    context.fillStyle = hasReveals ? "#6f4f09" : "#0b756b";
    context.font = `700 24px ${uiFont}`;
    context.fillText(
      hasReveals ? "With reveals" : "Clean solve",
      rightChipX + chipWidth / 2,
      chipY + 31
    );

    context.fillStyle = "rgba(255,255,255,0.86)";
    context.beginPath();
    context.roundRect(184, 598, width - 368, 540, 40);
    context.fill();

    const boardShellGradient = context.createLinearGradient(206, 626, width - 206, 1110);
    boardShellGradient.addColorStop(0, "rgba(255, 145, 127, 0.14)");
    boardShellGradient.addColorStop(1, "rgba(255, 225, 236, 0.2)");
    context.fillStyle = boardShellGradient;
    context.beginPath();
    context.roundRect(206, 626, width - 412, 480, 34);
    context.fill();

    context.strokeStyle = "rgba(127,50,86,0.14)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(184, 598, width - 368, 540, 40);
    context.stroke();

    const boardSize = 414;
    const cellSize = boardSize / puzzle.grid.length;
    const boardLeft = centerX - boardSize / 2;
    const boardTop = 640;

    context.fillStyle = "rgba(32,21,71,0.08)";
    context.beginPath();
    context.roundRect(boardLeft - 12, boardTop - 8, boardSize + 48, boardSize + 48, 34);
    context.fill();

    context.fillStyle = "rgba(255, 132, 118, 0.12)";
    context.beginPath();
    context.arc(centerX, boardTop + boardSize / 2, 268, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#fff8f1";
    context.beginPath();
    context.roundRect(boardLeft - 22, boardTop - 22, boardSize + 44, boardSize + 44, 32);
    context.fill();

    context.strokeStyle = "rgba(32,21,71,0.14)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(boardLeft - 22, boardTop - 22, boardSize + 44, boardSize + 44, 32);
    context.stroke();

    puzzle.grid.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const x = boardLeft + colIndex * cellSize;
        const y = boardTop + rowIndex * cellSize;
        const isBlack = cell === "#";
        const isRevealed = revealedCells.has(`${rowIndex}-${colIndex}`);
        const fill = isBlack
          ? "#201547"
          : isRevealed
            ? "#ffe18f"
            : "#ff8476";

        context.fillStyle = fill;
        context.beginPath();
        context.roundRect(x + 4, y + 4, cellSize - 8, cellSize - 8, 16);
        context.fill();

        if (!isBlack) {
          context.strokeStyle = "rgba(255,255,255,0.32)";
          context.lineWidth = 2;
          context.beginPath();
          context.roundRect(x + 8, y + 8, cellSize - 16, cellSize - 16, 12);
          context.stroke();
        }
      });
    });

    context.fillStyle = "#4a426a";
    context.font = `500 30px ${uiFont}`;
    context.fillText("Play today's puzzle at", centerX, 1338);

    const ctaGradient = context.createLinearGradient(156, 1376, width - 156, 1494);
    ctaGradient.addColorStop(0, "#2e225f");
    ctaGradient.addColorStop(1, "#563171");
    context.fillStyle = ctaGradient;
    context.beginPath();
    context.roundRect(156, 1376, width - 312, 118, 34);
    context.fill();

    context.strokeStyle = "rgba(255,255,255,0.12)";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(156, 1376, width - 312, 118, 34);
    context.stroke();

    context.fillStyle = "#ffffff";
    context.font = `700 34px ${uiFont}`;
    context.fillText("Play Letterbeat", centerX, 1413);
    context.font = `600 28px ${uiFont}`;
    context.fillText("letterbeat.vercel.app", centerX, 1457);

    context.fillStyle = "#7f3256";
    context.font = `700 26px ${uiFont}`;
    context.fillText("Daily 5x5 crossword", centerX, 1616);

    context.fillStyle = "#4a426a";
    context.font = `500 24px ${uiFont}`;
    context.fillText("Bright clues. Quick grids. Share the finish.", centerX, 1656);

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `letterbeat-story-${puzzle.date}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShareState("shared");
    window.setTimeout(() => setShareState("idle"), 1800);
  }

  const activeClue = useMemo(() => {
    const clueList =
      direction === "across" ? puzzle.clues.across : puzzle.clues.down;

    return (
      clueList.find(
        (clue) =>
          clue.row === activeWordCells[0]?.row &&
          clue.col === activeWordCells[0]?.col
      ) ??
      clueList.find(
        (clue) => clue.row === selectedRow && clue.col === selectedCol
      ) ??
      null
    );
  }, [activeWordCells, direction, puzzle, selectedCol, selectedRow]);

  const totalWordCount = puzzle.clues.across.length + puzzle.clues.down.length;
  const completedCount = visibleCompletedWords.size;
  const fillProgress = Math.round((completedCount / totalWordCount) * 100);
  const hasReveals = revealedCells.size > 0;

  return (
    <>
      <div className="space-y-8">
        <section className="rounded-[32px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_18px_45px_rgba(18,31,53,0.08)] sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(420px,540px)_minmax(0,1fr)] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
                  Time {formatTime(elapsedSeconds)}
                </span>
                <span className="rounded-full bg-[var(--card-muted)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
                  Progress {completedCount}/{totalWordCount}
                </span>
                <span className="rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
                  Autosaved
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">
                    Active clue
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-tight">
                    {activeClue
                      ? `${activeClue.number}. ${activeClue.clue}`
                      : "Select a clue to begin"}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--card-muted)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      Typing direction
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDirection("across");
                        focusActiveInput(selectedRow, selectedCol);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        direction === "across"
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(163,88,40,0.18)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
                      }`}
                    >
                      Across
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDirection("down");
                        focusActiveInput(selectedRow, selectedCol);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        direction === "down"
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(163,88,40,0.18)]"
                          : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)]"
                      }`}
                    >
                      Down
                    </button>
                    <span className="rounded-full bg-[var(--card-muted)] px-3 py-1.5 text-sm font-semibold text-[var(--muted)]">
                      {activeWordCells.length} letters
                    </span>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-[var(--card-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
                    style={{ width: `${fillProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRevealLetter}
                  className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--action-button-hover)] hover:text-[var(--action-button-active-text)] active:translate-y-0 active:bg-[var(--action-button-active)] active:text-[var(--action-button-active-text)] active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Reveal letter
                </button>

                <button
                  type="button"
                  onClick={handleCheckAnswers}
                  className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--action-button-hover)] hover:text-[var(--action-button-active-text)] active:translate-y-0 active:bg-[var(--action-button-active)] active:text-[var(--action-button-active-text)] active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Check letters
                </button>

                <button
                  type="button"
                  onClick={handleRevealWord}
                  className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--action-button-hover)] hover:text-[var(--action-button-active-text)] active:translate-y-0 active:bg-[var(--action-button-active)] active:text-[var(--action-button-active-text)] active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Reveal word
                </button>

                <button
                  type="button"
                  onClick={clearGrid}
                  className="rounded-full border border-[var(--action-button-border)] bg-[var(--action-button-bg)] px-4 py-2 text-sm font-semibold text-[var(--action-button-text)] shadow-[var(--button-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--line)] hover:bg-[var(--action-button-hover)] hover:text-[var(--action-button-active-text)] active:translate-y-0 active:bg-[var(--action-button-active)] active:text-[var(--action-button-active-text)] active:shadow-[var(--button-shadow-pressed),var(--button-shadow)]"
                  style={{ boxShadow: "var(--button-highlight), var(--button-shadow)" }}
                >
                  Clear board
                </button>

              </div>

              <section
                ref={boardSectionRef}
                className="flex justify-center rounded-[28px] border border-[var(--line)] bg-[var(--card-muted)] p-4 sm:p-5"
              >
                <div className="relative inline-block rounded-[24px] border border-[var(--line-strong)] bg-[var(--surface)] p-2 shadow-[0_12px_24px_rgba(18,31,53,0.06)] sm:p-3">
                  {usesTouchKeyboard && (
                    <input
                      ref={mobileInputRef}
                      type="text"
                      inputMode="text"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      enterKeyHint="done"
                      onChange={handleMobileInputChange}
                      onKeyDown={(event) =>
                        handleKeyInput(event, selectedRow, selectedCol)
                      }
                      className="absolute left-0 top-0 h-px w-px opacity-0"
                      aria-label="Mobile crossword input"
                    />
                  )}
                  {puzzle.grid.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex">
                      {row.map((cell, colIndex) => {
                        const isBlack = cell === "#";
                        const isSelected =
                          rowIndex === selectedRow && colIndex === selectedCol;
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const isInActiveWord = activeWordSet.has(cellKey);
                        const isWrong = activeWrongCells.has(cellKey);
                        const isCorrect = activeCorrectCells.has(cellKey);
                        const isRevealed = revealedCells.has(cellKey);
                        const isInCompletedWord =
                          completedCellSet.has(cellKey);

                        const cellNumber = getCellNumber(
                          puzzle,
                          rowIndex,
                          colIndex
                        );

                        return (
                          <div
                            key={cellKey}
                            className={[
                              "relative m-[1px] flex h-12 w-12 items-center justify-center rounded-[10px] border text-lg font-black uppercase transition-all duration-150 ease-out sm:h-14 sm:w-14 sm:rounded-[12px]",
                              isBlack
                                ? "border-[var(--black-cell)] bg-[var(--black-cell)]"
                                : "border-[var(--line-strong)] bg-[var(--cell-bg)] text-[var(--cell-text)]",
                              !isBlack && isInActiveWord
                                ? "bg-[var(--accent-soft)]"
                                : "",
                              isSelected
                                ? "z-10 scale-[1.03] border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_12px_24px_rgba(163,88,40,0.28)]"
                                : "",
                              isRevealed
                                ? "bg-[var(--card-muted)] text-[var(--ink-soft)]"
                                : "",
                              isInCompletedWord
                                ? "bg-[var(--success-soft)]"
                                : "",
                              isCorrect ? "bg-[var(--success)] text-[var(--accent-contrast)]" : "",
                              isWrong ? "bg-[var(--danger)] text-[var(--accent-contrast)]" : "",
                            ].join(" ")}
                          >
                            {!isBlack && cellNumber !== null && (
                              <span className="absolute left-1 top-0.5 text-[10px] font-semibold text-[var(--muted)]">
                                {cellNumber}
                              </span>
                            )}
                            {!isBlack ? (
                              <input
                                ref={(node) => {
                                  cellInputRefs.current[cellKey] = node;
                                }}
                                type="text"
                                inputMode="text"
                                autoCapitalize="characters"
                                autoCorrect="off"
                                autoComplete="off"
                                spellCheck={false}
                                maxLength={1}
                                value={userGrid[rowIndex]?.[colIndex] ?? ""}
                                readOnly={
                                  isRevealed ||
                                  (immediateChecks && activeCorrectCells.has(cellKey)) ||
                                  usesTouchKeyboard
                                }
                                aria-label={`Row ${rowIndex + 1} Column ${colIndex + 1}`}
                                onClick={() => handleCellClick(rowIndex, colIndex)}
                                onFocus={() => {
                                  setSelectedRow(rowIndex);
                                  setSelectedCol(colIndex);
                                }}
                                onChange={(event) =>
                                  handleCellInputChange(event, rowIndex, colIndex)
                                }
                                onKeyDown={(event) =>
                                  handleKeyInput(event, rowIndex, colIndex)
                                }
                                className="h-full w-full bg-transparent text-center text-[color:inherit] outline-none caret-[var(--accent)]"
                              />
                            ) : (
                              ""
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <ClueList
                puzzle={puzzle}
                activeDirection={direction}
                activeRow={activeWordCells[0]?.row ?? selectedRow}
                activeCol={activeWordCells[0]?.col ?? selectedCol}
                completedWords={visibleCompletedWords}
                revealedWords={revealedWords}
                onSelectClue={handleSelectClue}
              />
            </div>
          </div>
        </section>
      </div>

      {showWinModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.55)] p-4"
          onClick={() => setCompletionDismissed(true)}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="letterbeat-confetti"
                style={{
                  left: piece.left,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  backgroundColor: piece.color,
                  transform: `rotate(${piece.rotation})`,
                }}
              />
            ))}
          </div>
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative w-full max-w-md rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-6 text-[var(--ink)] shadow-[0_28px_60px_rgba(18,31,53,0.18)]"
          >
            <button
              type="button"
              onClick={() => setCompletionDismissed(true)}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] text-lg font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
            >
              ×
            </button>
            <h2 className="font-[family-name:var(--font-editorial)] text-3xl">
              Puzzle complete
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              You{" "}
              <span className="font-bold">
                {hasReveals ? "completed with reveals" : "solved"}
              </span>{" "}
              <span className="font-bold">puzzle {puzzle.date}</span>.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <div>
                Time: <span className="font-bold">{formatTime(elapsedSeconds)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-center">
              <div className="inline-block rounded-[24px] border border-[var(--line-strong)] bg-[var(--paper)] p-2 shadow-[0_12px_24px_rgba(18,31,53,0.06)]">
                {puzzle.solution.map((row, rowIndex) => (
                  <div key={`win-${rowIndex}`} className="flex">
                    {row.map((cell, colIndex) => {
                      const isBlack = cell === "#";
                      const cellNumber = getCellNumber(puzzle, rowIndex, colIndex);

                      return (
                        <div
                          key={`win-${rowIndex}-${colIndex}`}
                          className={[
                            "relative flex h-9 w-9 items-center justify-center border text-sm font-black uppercase sm:h-10 sm:w-10",
                            isBlack
                              ? "border-[var(--black-cell)] bg-[var(--black-cell)]"
                              : "border-[var(--line-strong)] bg-[var(--cell-bg)] text-[var(--cell-text)]",
                          ].join(" ")}
                        >
                          {!isBlack && cellNumber !== null && (
                            <span className="absolute left-1 top-0.5 text-[8px] font-semibold text-[var(--muted)]">
                              {cellNumber}
                            </span>
                          )}
                          {!isBlack ? cell : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={clearGrid}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                >
                  Clear board
                </button>

                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
                >
                  {shareState === "shared"
                    ? "Shared"
                    : shareState === "copied"
                    ? "Copied"
                    : shareState === "failed"
                      ? "Copy failed"
                      : "Copy"}
                </button>

                <button
                  type="button"
                  onClick={handleShareResult}
                  className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
                >
                  Share
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleInstagramStoryExport}
                  className="w-full max-w-[260px] rounded-[24px] border px-4 py-3 text-center transition hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--story-card-button-border)",
                    background: "var(--story-card-button-bg)",
                    boxShadow: "var(--story-card-button-shadow)",
                  }}
                >
                  <span
                    className="block font-[family-name:var(--font-editorial)] text-xl leading-none"
                    style={{ color: "var(--story-card-title)" }}
                  >
                    Completion Card
                  </span>
                </button>
              </div>
            </div>

            {shareFallbackText && (
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Manual copy
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Your browser blocked sharing. Copy the result below.
                </p>
                <textarea
                  readOnly
                  value={shareFallbackText}
                  onFocus={(event) => event.currentTarget.select()}
                  className="mt-3 min-h-32 w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] outline-none"
                />
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (
                          typeof navigator !== "undefined" &&
                          navigator.clipboard &&
                          typeof navigator.clipboard.writeText === "function"
                        ) {
                          await navigator.clipboard.writeText(shareFallbackText);
                          setShareState("copied");
                          window.setTimeout(() => setShareState("idle"), 1800);
                        }
                      } catch {
                        setShareState("failed");
                      }
                    }}
                    className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--card-muted)]"
                  >
                    Copy again
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareFallbackText(null)}
                    className="rounded-full border border-[var(--line)] bg-[var(--card-muted)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface)]"
                  >
                    Hide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .letterbeat-confetti {
          position: absolute;
          top: -10%;
          width: 10px;
          height: 18px;
          border-radius: 999px;
          opacity: 0.95;
          animation-name: letterbeat-confetti-fall;
          animation-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
          animation-iteration-count: 1;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
        }

        @keyframes letterbeat-confetti-fall {
          0% {
            transform: translate3d(0, -8%, 0) rotate(0deg);
          }
          100% {
            transform: translate3d(0, 120vh, 0) rotate(540deg);
          }
        }
      `}</style>
    </>
  );
}
