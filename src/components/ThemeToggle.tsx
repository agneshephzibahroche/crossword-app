"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initialTheme: Theme = saved === "dark" ? "dark" : "light";

    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black dark:border-gray-700 dark:bg-black dark:text-white"
      >
        Theme
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black dark:border-gray-700 dark:bg-black dark:text-white"
    >
      {theme === "light" ? "Switch to dark" : "Switch to light"}
    </button>
  );
}