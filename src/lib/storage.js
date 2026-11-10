const STORAGE_KEY = "habitnest:v1";

export const DEFAULT_HABITS = [
  "Wake up at 5 am",
  "Meditate for 15 minutes",
  "Workout",
  "Have a healthy breakfast",
  "Plan the day",
];

export function makeHabit(name) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    name: name.trim(),
    completions: [],
  };
}

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
  return DEFAULT_HABITS.map(makeHabit);
}

export function saveHabits(habits) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits }));
  } catch {
    // Storage unavailable (private mode, quota): progress lasts for this visit.
  }
}
