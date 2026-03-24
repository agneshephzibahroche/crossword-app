"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CrosswordGrid from "@/components/CrosswordGrid";
import { Puzzle } from "@/types/puzzle";
import { ThemeMode } from "@/types/theme";

type Props = {
  puzzle: Puzzle;
};

export default function HomeClientWithPuzzle({ puzzle }: Props) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [loadingPuzzle, setLoadingPuzzle] = useState(false);
  const router = useRouter();

  const isDark = theme === "dark";

  function handleNewPuzzle() {
    setLoadingPuzzle(true);
    router.refresh();
  }

  return (
    <main
      className={`min-h-screen px-5 py-8 sm:px-6 sm:py-10 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleNewPuzzle}
            disabled={loadingPuzzle}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isDark
                ? "bg-neutral-800 text-white hover:bg-neutral-700"
                : "bg-neutral-200 text-black hover:bg-neutral-300"
            } ${loadingPuzzle ? "cursor-not-allowed opacity-60" : ""}`}
          >
            {loadingPuzzle ? "Loading..." : "🎲 New Puzzle"}
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isDark
                ? "border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
                : "border-neutral-300 bg-white text-black hover:bg-neutral-50"
            }`}
          >
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <header
          className={`mb-8 rounded-3xl border px-6 py-6 sm:px-8 sm:py-7 ${
            isDark
              ? "border-neutral-800 bg-neutral-950"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-[0.28em] ${
              isDark ? "text-pink-300" : "text-pink-600"
            }`}
          >
            Crossword
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {puzzle.title}
          </h1>

          <p
            className={`mt-2 text-sm sm:text-base ${
              isDark ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            {puzzle.date}
          </p>
        </header>

        <CrosswordGrid puzzle={puzzle} theme={theme} />
      </div>
    </main>
  );
}