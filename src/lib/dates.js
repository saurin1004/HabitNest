// Dates are stored as local-time "YYYY-MM-DD" keys so a check-in always
// belongs to the day the user saw on their own clock.

export function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key, days) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// The last `n` day keys ending at `endKey`, oldest first.
export function lastNDays(endKey, n) {
  return Array.from({ length: n }, (_, i) => addDays(endKey, i - (n - 1)));
}

export function weekdayShort(key) {
  return fromDateKey(key).toLocaleDateString(undefined, { weekday: "narrow" });
}

export function longDate(key) {
  return fromDateKey(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
