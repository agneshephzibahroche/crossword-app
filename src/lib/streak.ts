// Consecutive-day streak, computed from the same solvedDates array already
// tracked in localStorage stats -- no new storage needed. "Current" only
// counts if the most recent solve was today or yesterday; missing more
// than one day breaks it, same as Wordle-style streaks.
function dateKeyToDayNumber(dateKey: string) {
  return Math.floor(new Date(`${dateKey}T00:00:00Z`).getTime() / 86400000);
}

export function computeStreak(solvedDates: string[], todayDate: string) {
  if (solvedDates.length === 0) {
    return { current: 0, longest: 0 };
  }

  const days = Array.from(new Set(solvedDates.map(dateKeyToDayNumber))).sort(
    (a, b) => a - b
  );

  let longest = 1;
  let run = 1;
  for (let index = 1; index < days.length; index += 1) {
    run = days[index] === days[index - 1] + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const todayNumber = dateKeyToDayNumber(todayDate);
  const lastSolvedDay = days[days.length - 1];

  if (lastSolvedDay < todayNumber - 1) {
    return { current: 0, longest };
  }

  let current = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    if (days[index] === days[index - 1] + 1) {
      current += 1;
    } else {
      break;
    }
  }

  return { current, longest };
}
