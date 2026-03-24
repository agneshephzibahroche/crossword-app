"use client";

import { useEffect, useMemo, useState } from "react";
import { Direction, Puzzle } from "@/types/puzzle";
import { ThemeMode } from "@/types/theme";
import { getCellNumber, getWordCells } from "@/lib/crossword";
import ClueList from "@/components/ClueList";

type Props = {
  puzzle: Puzzle;
  theme: ThemeMode;
};

type CrosswordStats = {
  solvedCount: number;
  bestTimeSeconds: number | null;
};

const STATS_KEY = "crossword-stats";

export default function CrosswordGrid({ puzzle, theme }: Props) {
  const isDark = theme === "dark";

  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [direction, setDirection] = useState<Direction>("across");
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWinModal, setShowWinModal] = useState(false);
  const [stats, setStats] = useState<CrosswordStats>({
    solvedCount: 0,
    bestTimeSeconds: null,
  });

  const storageKey = `crossword-progress-${puzzle.id}`;

  const emptyGrid = useMemo(
    () =>
      puzzle.grid.map((row) =>
        row.map((cell) => (cell === "#" ? "#" : ""))
      ),
    [puzzle.grid]
  );

  const [userGrid, setUserGrid] = useState<string[][]>(emptyGrid);

  useEffect(() => {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      try {
        setStats(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length === puzzle.rows &&
          parsed.every(
            (row: unknown) => Array.isArray(row) && row.length === puzzle.cols
          )
        ) {
          setUserGrid(parsed as string[][]);
        } else {
          setUserGrid(emptyGrid);
        }
      } catch {
        setUserGrid(emptyGrid);
      }
    } else {
      setUserGrid(emptyGrid);
    }

    setWrongCells(new Set());
    setCorrectCells(new Set());
    setElapsedSeconds(0);
    setShowWinModal(false);
    setSelectedRow(0);
    setSelectedCol(0);
    setDirection("across");
  }, [storageKey, emptyGrid, puzzle.rows, puzzle.cols]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(userGrid));
  }, [storageKey, userGrid]);

  function isBlackCell(row: number, col: number) {
    return puzzle.grid[row][col] === "#";
  }

  function moveSelection(row: number, col: number) {
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
  }

  function handleCellClick(row: number, col: number) {
    if (isBlackCell(row, col)) return;

    if (selectedRow === row && selectedCol === col) {
      setDirection((prev) => (prev === "across" ? "down" : "across"));
    } else {
      setSelectedRow(row);
      setSelectedCol(col);
    }
  }

  function handleSelectClue(
    row: number,
    col: number,
    nextDirection: Direction
  ) {
    setSelectedRow(row);
    setSelectedCol(col);
    setDirection(nextDirection);
  }

  function clearCheckedCell(row: number, col: number) {
    const key = `${row}-${col}`;

    setWrongCells((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    setCorrectCells((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  function handleCheckAnswers() {
    const wrong = new Set<string>();
    const correct = new Set<string>();

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.grid[r][c] === "#") continue;

        const typed = userGrid[r][c];
        const answer = puzzle.solution[r][c];

        if (typed === "") continue;

        if (typed === answer) {
          correct.add(`${r}-${c}`);
        } else {
          wrong.add(`${r}-${c}`);
        }
      }
    }

    setWrongCells(wrong);
    setCorrectCells(correct);
  }

  function handleClearChecks() {
    setWrongCells(new Set());
    setCorrectCells(new Set());
  }

  function handleResetPuzzle() {
    setUserGrid(emptyGrid);
    setWrongCells(new Set());
    setCorrectCells(new Set());
    setElapsedSeconds(0);
    setShowWinModal(false);
    localStorage.removeItem(storageKey);
  }

  function handleRevealLetter() {
    if (isBlackCell(selectedRow, selectedCol)) return;

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[selectedRow][selectedCol] = puzzle.solution[selectedRow][selectedCol];
      return next;
    });

    clearCheckedCell(selectedRow, selectedCol);
  }

  function handleRevealWord() {
    const cells = getWordCells(puzzle, selectedRow, selectedCol, direction);
    if (cells.length === 0) return;

    setUserGrid((prev) => {
      const next = prev.map((row) => [...row]);

      for (const cell of cells) {
        next[cell.row][cell.col] = puzzle.solution[cell.row][cell.col];
      }

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

  const activeWordCells = useMemo(() => {
    return getWordCells(puzzle, selectedRow, selectedCol, direction);
  }, [puzzle, selectedRow, selectedCol, direction]);

  const activeWordSet = useMemo(() => {
    return new Set(activeWordCells.map((cell) => `${cell.row}-${cell.col}`));
  }, [activeWordCells]);

  useEffect(() => {
    if (showWinModal) return;

    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(id);
  }, [showWinModal, storageKey]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (showWinModal) return;
      if (isBlackCell(selectedRow, selectedCol)) return;

      if (/^[a-zA-Z]$/.test(e.key)) {
        const letter = e.key.toUpperCase();

        setUserGrid((prev) => {
          const next = prev.map((row) => [...row]);
          next[selectedRow][selectedCol] = letter;
          return next;
        });

        clearCheckedCell(selectedRow, selectedCol);

        if (direction === "across") {
          moveSelection(selectedRow, selectedCol + 1);
        } else {
          moveSelection(selectedRow + 1, selectedCol);
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();

        setUserGrid((prev) => {
          const next = prev.map((row) => [...row]);
          next[selectedRow][selectedCol] = "";
          return next;
        });

        clearCheckedCell(selectedRow, selectedCol);
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveSelection(selectedRow, selectedCol + 1);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveSelection(selectedRow, selectedCol - 1);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveSelection(selectedRow + 1, selectedCol);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveSelection(selectedRow - 1, selectedCol);
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        setDirection((prev) => (prev === "across" ? "down" : "across"));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRow, selectedCol, direction, puzzle.rows, puzzle.cols, showWinModal]);

  const isComplete = useMemo(() => {
    if (puzzle.clues.across.length + puzzle.clues.down.length === 0) {
      return false;
    }

    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        if (puzzle.grid[r][c] === "#") continue;

        if (userGrid[r][c] !== puzzle.solution[r][c]) {
          return false;
        }
      }
    }

    return true;
  }, [userGrid, puzzle]);

  useEffect(() => {
    if (!isComplete || showWinModal) return;

    setShowWinModal(true);

    const nextStats: CrosswordStats = {
      solvedCount: stats.solvedCount + 1,
      bestTimeSeconds:
        stats.bestTimeSeconds === null
          ? elapsedSeconds
          : Math.min(stats.bestTimeSeconds, elapsedSeconds),
    };

    setStats(nextStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(nextStats));
  }, [isComplete, showWinModal, elapsedSeconds, stats]);

  function formatTime(totalSeconds: number) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <>
      <div className="grid gap-8 xl:grid-cols-[auto_minmax(320px,1fr)]">
        <div className="space-y-4">
          <section
            className={`rounded-3xl border p-5 sm:p-6 ${
              isDark
                ? "border-neutral-800 bg-neutral-950"
                : "border-neutral-200 bg-neutral-50"
            }`}
          >
            <div className="mb-5 flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark ? "bg-blue-950 text-blue-300" : "bg-blue-100 text-blue-700"
                }`}
              >
                Direction: {direction}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark
                    ? "bg-yellow-900/40 text-yellow-200"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {puzzle.rows} × {puzzle.cols}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark
                    ? "bg-green-950 text-green-300"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Time: {formatTime(elapsedSeconds)}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark ? "bg-pink-950 text-pink-300" : "bg-pink-100 text-pink-700"
                }`}
              >
                Solved: {stats.solvedCount}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark
                    ? "bg-green-950 text-green-300"
                    : "bg-green-100 text-green-700"
                }`}
              >
                Green = correct
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark ? "bg-red-950 text-red-300" : "bg-red-100 text-red-700"
                }`}
              >
                Red = wrong
              </span>

              <button
                type="button"
                onClick={handleCheckAnswers}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  isDark
                    ? "bg-neutral-800 text-white hover:bg-neutral-700"
                    : "bg-neutral-200 text-black hover:bg-neutral-300"
                }`}
              >
                Check Answers
              </button>

              <button
                type="button"
                onClick={handleClearChecks}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  isDark
                    ? "bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
                    : "bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                Clear Checks
              </button>

              <button
                type="button"
                onClick={handleRevealLetter}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  isDark
                    ? "bg-yellow-900/50 text-yellow-200 hover:bg-yellow-900/70"
                    : "bg-yellow-200 text-yellow-900 hover:bg-yellow-300"
                }`}
              >
                Reveal Letter
              </button>

              <button
                type="button"
                onClick={handleRevealWord}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  isDark
                    ? "bg-amber-900/50 text-amber-200 hover:bg-amber-900/70"
                    : "bg-amber-200 text-amber-900 hover:bg-amber-300"
                }`}
              >
                Reveal Word
              </button>

              <button
                type="button"
                onClick={handleResetPuzzle}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  isDark ? "bg-red-950 text-red-200 hover:bg-red-900" : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                Reset Puzzle
              </button>
            </div>

            <div
              className={`inline-block rounded-2xl border p-3 sm:p-4 ${
                isDark ? "border-neutral-700 bg-neutral-900" : "border-yellow-300 bg-yellow-50"
              }`}
            >
              {puzzle.grid.map((row, r) => (
                <div key={r} className="flex">
                  {row.map((cell, c) => {
                    const isBlack = cell === "#";
                    const isSelected = r === selectedRow && c === selectedCol;
                    const isInActiveWord = activeWordSet.has(`${r}-${c}`);
                    const isWrong = wrongCells.has(`${r}-${c}`);
                    const isCorrect = correctCells.has(`${r}-${c}`);
                    const cellNumber = getCellNumber(puzzle, r, c);

                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        onClick={() => handleCellClick(r, c)}
                        className={[
                          "relative flex h-12 w-12 items-center justify-center border text-lg font-black transition-all duration-150 ease-out sm:h-14 sm:w-14",
                          isBlack
                            ? isDark
                              ? "border-neutral-950 bg-neutral-950"
                              : "border-neutral-800 bg-neutral-800"
                            : isDark
                              ? "border-neutral-600 bg-neutral-800 text-white"
                              : "border-yellow-300 bg-yellow-50 text-black",
                          !isBlack && isInActiveWord
                            ? isDark
                              ? "bg-yellow-900/40 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.18),0_0_10px_rgba(250,204,21,0.08)]"
                              : "bg-yellow-100 shadow-[inset_0_0_0_1px_rgba(250,204,21,0.35),0_0_10px_rgba(250,204,21,0.18)]"
                            : "",
                          isSelected
                            ? isDark
                              ? "z-10 scale-[1.05] bg-yellow-400 text-black ring-2 ring-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.45)]"
                              : "z-10 scale-[1.05] bg-yellow-300 text-black ring-2 ring-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.22)]"
                            : "",
                          isCorrect
                            ? isDark
                              ? "bg-green-600 text-white ring-2 ring-green-300"
                              : "bg-green-200 text-green-900 ring-2 ring-green-400"
                            : "",
                          isWrong
                            ? isDark
                              ? "bg-red-600 text-white ring-2 ring-red-300"
                              : "bg-red-200 text-red-900 ring-2 ring-red-400"
                            : "",
                          !isBlack
                            ? isDark
                              ? "hover:bg-neutral-700"
                              : "hover:bg-yellow-100"
                            : "",
                        ].join(" ")}
                      >
                        {!isBlack && cellNumber !== null && (
                          <span
                            className={`absolute left-1 top-0.5 text-[10px] font-bold ${
                              isDark ? "text-neutral-400" : "text-neutral-500"
                            }`}
                          >
                            {cellNumber}
                          </span>
                        )}
                        {!isBlack ? userGrid[r][c] : ""}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>
        </div>

        <ClueList
          puzzle={puzzle}
          activeDirection={direction}
          activeRow={activeWordCells[0]?.row ?? selectedRow}
          activeCol={activeWordCells[0]?.col ?? selectedCol}
          onSelectClue={handleSelectClue}
          theme={theme}
        />
      </div>

      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${
              isDark ? "border-neutral-700 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-black"
            }`}
          >
            <h2 className="text-2xl font-black">Puzzle complete 🎉</h2>
            <p className={`mt-2 ${isDark ? "text-neutral-300" : "text-neutral-600"}`}>
              You solved <span className="font-bold">{puzzle.title}</span>.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              <div>
                Time: <span className="font-bold">{formatTime(elapsedSeconds)}</span>
              </div>
              <div>
                Solved total: <span className="font-bold">{stats.solvedCount}</span>
              </div>
              <div>
                Best time:{" "}
                <span className="font-bold">
                  {stats.bestTimeSeconds === null ? "—" : formatTime(stats.bestTimeSeconds)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  isDark ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-neutral-200 text-black hover:bg-neutral-300"
                }`}
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleResetPuzzle}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  isDark ? "bg-yellow-700 text-white hover:bg-yellow-600" : "bg-yellow-300 text-black hover:bg-yellow-400"
                }`}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}