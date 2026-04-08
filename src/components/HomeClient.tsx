"use client";

import { useState } from "react";
import CrosswordGrid from "@/components/CrosswordGrid";
import { samplePuzzle } from "@/lib/samplePuzzle";
import { ThemeMode } from "@/types/theme";

export default function HomeClient() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const isDark = theme === "dark";

  return (
    <main
      className={`min-h-screen px-5 py-8 sm:px-6 sm:py-10 ${
        isDark ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition hover:scale-[1.02] active:scale-[0.98] ${
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[0.28em] ${
                  isDark ? "text-pink-300" : "text-pink-600"
                }`}
              >
                Daily Crossword
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                {samplePuzzle.title}
              </h1>

              <p
                className={`mt-2 text-sm sm:text-base ${
                  isDark ? "text-neutral-400" : "text-neutral-600"
                }`}
              >
                {samplePuzzle.date}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark
                    ? "bg-pink-950 text-pink-300"
                    : "bg-pink-100 text-pink-700"
                }`}
              >
                Cozy mode
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  isDark
                    ? "bg-blue-950 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                Mini puzzle
              </span>
            </div>
          </div>
        </header>

        <CrosswordGrid immediateChecks={false} puzzle={samplePuzzle} />
      </div>
    </main>
  );
}
