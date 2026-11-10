import { useCallback, useEffect, useState } from "react";
import { loadHabits, makeHabit, saveHabits } from "../lib/storage.js";
import { toDateKey } from "../lib/dates.js";

export function useHabits() {
  const [habits, setHabits] = useState(loadHabits);

  useEffect(() => saveHabits(habits), [habits]);

  const addHabit = useCallback((name) => {
    if (!name.trim()) return;
    setHabits((hs) => [...hs, makeHabit(name)]);
  }, []);

  const renameHabit = useCallback((id, name) => {
    if (!name.trim()) return;
    setHabits((hs) => hs.map((h) => (h.id === id ? { ...h, name: name.trim() } : h)));
  }, []);

  const removeHabit = useCallback((id) => {
    setHabits((hs) => hs.filter((h) => h.id !== id));
  }, []);

  const toggleDay = useCallback((id, dateKey) => {
    setHabits((hs) =>
      hs.map((h) => {
        if (h.id !== id) return h;
        const done = h.completions.includes(dateKey);
        return {
          ...h,
          completions: done
            ? h.completions.filter((d) => d !== dateKey)
            : [...h.completions, dateKey].sort(),
        };
      })
    );
  }, []);

  return { habits, addHabit, renameHabit, removeHabit, toggleDay };
}

// Today's date key, kept current across midnight and when the tab regains focus.
export function useToday() {
  const [today, setToday] = useState(() => toDateKey(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toDateKey(new Date()));
    const timer = setInterval(refresh, 60 * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return today;
}
