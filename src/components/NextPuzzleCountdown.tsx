"use client";

import { useEffect, useState } from "react";

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
}

export default function NextPuzzleCountdown() {
  const [timeUntilNextPuzzle, setTimeUntilNextPuzzle] = useState("00:00:00");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      const diffSeconds = Math.max(
        0,
        Math.floor((nextMidnight.getTime() - now.getTime()) / 1000)
      );

      setTimeUntilNextPuzzle(formatCountdown(diffSeconds));
    }

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[24px] border border-[var(--line)] bg-[var(--card)] px-4 py-4 shadow-[0_12px_28px_rgba(18,31,53,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        Next puzzle
      </p>
      <p className="mt-2 font-[family-name:var(--font-editorial)] text-3xl leading-none">
        {timeUntilNextPuzzle}
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        A new daily grid drops at midnight on your device.
      </p>
    </div>
  );
}
