// How habits are stored in an account.
//
// The app works with an ordered array of { id, name, completions, order }.
// Firestore stores a map keyed by habit id, so every change touches only its
// own fields (one habit's name, one day's check-in, one habit's position).
// Changes made on different devices then merge instead of overwriting each other.

export function toMap(habits) {
  const map = {};
  habits.forEach((h, i) => {
    map[h.id] = { name: h.name, order: i, completions: [...new Set(h.completions)].sort() };
  });
  return map;
}

// Accepts the current map format or the original array format.
export function toArray(stored) {
  if (!stored) return [];
  if (Array.isArray(stored)) {
    return stored.map((h, i) => ({ id: h.id, name: h.name, completions: [...h.completions], order: i }));
  }
  return (
    Object.entries(stored)
      // A check-in can arrive for a habit another device just deleted; ignore those leftovers.
      .filter(([, h]) => h && typeof h.name === "string")
      .map(([id, h]) => ({
        id,
        name: h.name,
        completions: Array.isArray(h.completions) ? [...h.completions].sort() : [],
        order: typeof h.order === "number" ? h.order : Number.MAX_SAFE_INTEGER,
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  );
}

// Position for an item placed between two neighbours (either may be missing).
export function orderBetween(before, after) {
  if (before == null && after == null) return 0;
  if (before == null) return after - 1;
  if (after == null) return before + 1;
  return (before + after) / 2;
}

export const nextOrder = (habits) =>
  habits.length ? Math.max(...habits.map((h) => h.order ?? 0)) + 1 : 0;
