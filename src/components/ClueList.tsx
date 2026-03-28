"use client";

import { Direction, Puzzle } from "@/types/puzzle";
import { ThemeMode } from "@/types/theme";

type Props = {
  puzzle: Puzzle;
  activeDirection: Direction;
  activeRow: number;
  activeCol: number;
  onSelectClue: (row: number, col: number, direction: Direction) => void;
  theme: ThemeMode;
};

export default function ClueList({
  puzzle,
  activeDirection,
  activeRow,
  activeCol,
  onSelectClue,
  theme,
}: Props) {
  const isDark = theme === "dark";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section
        className={`rounded-3xl border p-5 sm:p-6 ${
          isDark ? "border-pink-900 bg-[#2a1f24]" : "border-pink-200 bg-pink-50"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-xl font-black ${isDark ? "text-pink-300" : "text-pink-700"}`}>
            Across
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isDark ? "bg-pink-950 text-pink-300" : "bg-pink-100 text-pink-700"
            }`}
          >
            {puzzle.clues.across.length} clues
          </span>
        </div>

        <ul className="space-y-2">
          {puzzle.clues.across.map((clue) => {
            const isActive =
              activeDirection === "across" &&
              activeRow === clue.row &&
              activeCol === clue.col;

            return (
              <li key={`across-${clue.number}`}>
                <button
                  type="button"
                  onClick={() => onSelectClue(clue.row, clue.col, "across")}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition sm:text-base ${
                    isActive
                      ? isDark
                        ? "bg-pink-700 text-white shadow-sm"
                        : "bg-pink-400 text-white shadow-sm"
                      : isDark
                        ? "text-white hover:bg-pink-900/40"
                        : "text-black hover:bg-pink-100"
                  }`}
                >
                  <span className="mr-2 inline-block min-w-6 font-black">
                    {clue.number}.
                  </span>
                  {clue.clue}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className={`rounded-3xl border p-5 sm:p-6 ${
          isDark ? "border-blue-900 bg-[#1f2937]" : "border-blue-200 bg-blue-50"
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className={`text-xl font-black ${isDark ? "text-blue-300" : "text-blue-700"}`}>
            Down
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              isDark ? "bg-blue-950 text-blue-300" : "bg-blue-100 text-blue-700"
            }`}
          >
            {puzzle.clues.down.length} clues
          </span>
        </div>

        <ul className="space-y-2">
          {puzzle.clues.down.map((clue) => {
            const isActive =
              activeDirection === "down" &&
              activeRow === clue.row &&
              activeCol === clue.col;

            return (
              <li key={`down-${clue.number}`}>
                <button
                  type="button"
                  onClick={() => onSelectClue(clue.row, clue.col, "down")}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition sm:text-base ${
                    isActive
                      ? isDark
                        ? "bg-blue-700 text-white shadow-sm"
                        : "bg-blue-400 text-white shadow-sm"
                      : isDark
                        ? "text-white hover:bg-blue-900/40"
                        : "text-black hover:bg-blue-100"
                  }`}
                >
                  <span className="mr-2 inline-block min-w-6 font-black">
                    {clue.number}.
                  </span>
                  {clue.clue}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}