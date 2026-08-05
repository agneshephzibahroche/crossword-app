"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import CategoriesGame from "@/components/CategoriesGame";
import type { CategoriesPuzzle } from "@/types/categories";
import { ThemeMode } from "@/types/theme";

type Props = {
  puzzle: CategoriesPuzzle;
};

const THEME_KEY = "letterbeat-theme";
const THEME_EVENT = "letterbeat-theme-change";

function formatLongDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_KEY) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onStoreChange);
  };
}

function getThemeSnapshot(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return "dark";
}

function getThemeServerSnapshot(): ThemeMode {
  return "dark";
}

export default function CategoriesPageClient({ puzzle }: Props) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(THEME_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <main className="min-h-[100dvh] bg-transparent text-[var(--ink)] transition-colors">
      <div className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="border-y border-[var(--line)] py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="inline-flex rounded-full bg-[var(--info-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-[var(--info)]">
                Letterbeat
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(18,31,53,0.08)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                Crossword
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(18,31,53,0.08)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
              >
                {theme === "light" ? "Dark" : "Light"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex min-h-[132px] flex-col justify-center rounded-[24px] border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-4 shadow-[0_12px_28px_rgba(18,31,53,0.06)]">
              <div className="flex flex-wrap items-center justify-center gap-2 text-center md:justify-start md:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Today&apos;s categories
                </p>
              </div>
              <p className="mt-2 text-center font-[family-name:var(--font-editorial)] text-3xl leading-none text-[var(--ink)] md:text-left">
                {formatLongDate(puzzle.date)}
              </p>
              <p className="mt-2 text-center text-sm text-[var(--muted)] md:text-left">
                Group the 12 words into 3 sets of 4
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 max-w-[560px]">
          <CategoriesGame key={puzzle.id} puzzle={puzzle} />
        </div>
      </div>
    </main>
  );
}
