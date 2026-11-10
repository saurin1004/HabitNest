const STORAGE_KEY = "habitnest:v1";

export const DEFAULT_HABITS = [
  "Wake up at 5 am",
  "Meditate for 15 minutes",
  "Workout",
  "Have a healthy breakfast",
  "Plan the day",
];

export function makeHabit(name, id) {
  return {
    id: id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
    name: name.trim(),
    completions: [],
  };
}

// Starter habits get stable ids so they line up across devices when merged.
export const starterHabits = () => DEFAULT_HABITS.map((name, i) => makeHabit(name, `starter-${i + 1}`));

export function loadHabits() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.habits)) return data.habits;
    }
  } catch {
    // Storage blocked or corrupted: fall back to the starter habits.
  }
  return starterHabits();
}

export function saveHabits(habits) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits }));
  } catch {
    // Storage unavailable (private mode, quota): progress lasts for this visit.
  }
}

// After guest data has been merged into an account it no longer belongs on this device.
export function clearGuestHabits() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
