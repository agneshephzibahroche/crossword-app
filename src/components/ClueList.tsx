"use client";

import { Direction, Puzzle } from "@/types/puzzle";

type Props = {
  puzzle: Puzzle;
  activeDirection: Direction;
  activeRow: number;
  activeCol: number;
  completedWords: Set<string>;
  revealedWords: Set<string>;
  onSelectClue: (row: number, col: number, direction: Direction) => void;
};

export default function ClueList({
  puzzle,
  activeDirection,
  activeRow,
  activeCol,
  completedWords,
  revealedWords,
  onSelectClue,
}: Props) {
  function wordKey(row: number, col: number, direction: Direction) {
    return `${row}-${col}-${direction}`;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.05)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-editorial)] text-2xl text-[var(--ink)]">
            Across
          </h2>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            {puzzle.clues.across.length} clues
          </span>
        </div>

        <ul className="space-y-2">
          {puzzle.clues.across.map((clue) => {
            const isActive =
              activeDirection === "across" &&
              activeRow === clue.row &&
              activeCol === clue.col;
            const isComplete = completedWords.has(
              wordKey(clue.row, clue.col, "across")
            );
            const isRevealed = revealedWords.has(
              wordKey(clue.row, clue.col, "across")
            );

            return (
              <li key={`across-${clue.number}`}>
                <button
                  type="button"
                  onClick={() => onSelectClue(clue.row, clue.col, "across")}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition sm:text-base ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(163,88,40,0.18)]"
                      : "border-transparent bg-[var(--card-muted)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="mr-2 inline-block min-w-6 font-black">
                        {clue.number}.
                      </span>
                      {clue.clue}
                    </span>
                    {(isComplete || isRevealed) && (
                      <span
                        className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
                          isActive
                            ? "bg-white/18 text-[var(--accent-contrast)]"
                            : isRevealed
                              ? "bg-[var(--card-muted)] text-[var(--muted)]"
                              : "bg-[var(--success-soft)] text-[var(--success)]"
                        }`}
                      >
                        {isRevealed ? "Revealed" : "Solved"}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--card)] p-5 shadow-[0_16px_40px_rgba(18,31,53,0.05)] sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-editorial)] text-2xl text-[var(--ink)]">
            Down
          </h2>
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            {puzzle.clues.down.length} clues
          </span>
        </div>

        <ul className="space-y-2">
          {puzzle.clues.down.map((clue) => {
            const isActive =
              activeDirection === "down" &&
              activeRow === clue.row &&
              activeCol === clue.col;
            const isComplete = completedWords.has(
              wordKey(clue.row, clue.col, "down")
            );
            const isRevealed = revealedWords.has(
              wordKey(clue.row, clue.col, "down")
            );

            return (
              <li key={`down-${clue.number}`}>
                <button
                  type="button"
                  onClick={() => onSelectClue(clue.row, clue.col, "down")}
                  className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition sm:text-base ${
                    isActive
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[0_10px_24px_rgba(163,88,40,0.18)]"
                      : "border-transparent bg-[var(--card-muted)] text-[var(--ink)] hover:border-[var(--line-strong)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="mr-2 inline-block min-w-6 font-black">
                        {clue.number}.
                      </span>
                      {clue.clue}
                    </span>
                    {(isComplete || isRevealed) && (
                      <span
                        className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] ${
                          isActive
                            ? "bg-white/18 text-[var(--accent-contrast)]"
                            : isRevealed
                              ? "bg-[var(--card-muted)] text-[var(--muted)]"
                              : "bg-[var(--success-soft)] text-[var(--success)]"
                        }`}
                      >
                        {isRevealed ? "Revealed" : "Solved"}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
