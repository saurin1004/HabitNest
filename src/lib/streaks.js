import { addDays, lastNDays } from "./dates.js";

// A streak is the run of consecutive completed days ending today.
// If today isn't checked off yet, a run ending yesterday still counts:
// the day isn't over, so the streak isn't broken.
export function currentStreak(completions, todayKey) {
  const done = new Set(completions);
  let day = done.has(todayKey) ? todayKey : addDays(todayKey, -1);
  let streak = 0;
  while (done.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

export function bestStreak(completions) {
  const days = [...new Set(completions)].sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of days) {
    run = prev !== null && addDays(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

// Share of possible check-ins completed over the last `days` days (0–1).
export function completionRate(habits, todayKey, days = 7) {
  if (habits.length === 0) return 0;
  const window = new Set(lastNDays(todayKey, days));
  const done = habits.reduce(
    (sum, h) => sum + h.completions.filter((d) => window.has(d)).length,
    0
  );
  return done / (habits.length * days);
}
