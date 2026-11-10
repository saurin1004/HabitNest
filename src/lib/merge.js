// Merge guest (local) habits into the habits stored on an account.
// The account is the source of truth for names and order; check-ins are
// combined so nothing done offline or before signing in is lost.
// Habits match by id first, then by name (case-insensitive), so the same
// starter habit created on two devices doesn't appear twice.

const norm = (name) => name.trim().toLowerCase();

export function mergeHabits(remote, local) {
  const merged = remote.map((h) => ({ ...h, completions: [...h.completions] }));
  const byId = new Map(merged.map((h) => [h.id, h]));
  const byName = new Map(merged.map((h) => [norm(h.name), h]));

  for (const h of local) {
    const match = byId.get(h.id) || byName.get(norm(h.name));
    if (match) {
      match.completions = [...new Set([...match.completions, ...h.completions])].sort();
    } else {
      const copy = { ...h, completions: [...h.completions].sort() };
      merged.push(copy);
      byId.set(copy.id, copy);
      byName.set(norm(copy.name), copy);
    }
  }
  return merged;
}

// True when local data is just the untouched starter list, which isn't worth merging.
export function isPristine(habits, defaults) {
  return (
    habits.every((h) => h.completions.length === 0) &&
    habits.length === defaults.length &&
    habits.every((h, i) => h.name === defaults[i])
  );
}
