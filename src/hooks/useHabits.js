import { useCallback, useEffect, useRef, useState } from "react";
import { clearGuestHabits, loadHabits, makeHabit, saveHabits, DEFAULT_HABITS } from "../lib/storage.js";
import { isPristine, mergeHabits } from "../lib/merge.js";
import { toDateKey } from "../lib/dates.js";
import { loadCloud } from "./useAccount.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// Habit state. Guests keep it in localStorage; signed-in users keep it in
// Firestore (cached offline), with any guest progress merged in on sign-in.
export function useHabits(uid) {
  const [habits, setHabits] = useState(loadHabits);
  // "local" | "loading" | "synced" | "pending" | "error"
  const [sync, setSync] = useState(uid ? "loading" : "local");
  const remote = useRef(null); // last habits seen from / sent to the account
  const ready = useRef(!uid);

  // Connect to the account when a verified user signs in.
  useEffect(() => {
    if (!uid) {
      remote.current = null;
      ready.current = true;
      setHabits(loadHabits());
      setSync("local");
      return undefined;
    }

    ready.current = false;
    setSync("loading");
    let unwatch = () => {};
    let cancelled = false;

    (async () => {
      try {
        const cloud = await loadCloud();
        const stored = await cloud.fetchHabits(uid);
        const guest = loadHabits();
        const guestCounts = !isPristine(guest, DEFAULT_HABITS);
        let initial = stored ?? guest;
        if (stored && guestCounts) initial = mergeHabits(stored, guest);
        if (!stored || !same(initial, stored)) await cloud.writeHabits(uid, initial);
        clearGuestHabits();
        if (cancelled) return;

        remote.current = initial;
        setHabits(initial);
        ready.current = true;
        setSync("synced");

        unwatch = cloud.watchHabits(uid, (next, pending) => {
          setSync(pending ? "pending" : "synced");
          if (!same(next, remote.current)) {
            remote.current = next;
            setHabits(next);
          }
        });
      } catch (err) {
        console.error("Sync failed", err);
        if (!cancelled) setSync("error");
      }
    })();

    return () => {
      cancelled = true;
      unwatch();
    };
  }, [uid]);

  // Persist changes: locally for guests, to Firestore for signed-in users.
  useEffect(() => {
    if (!ready.current) return undefined;
    if (!uid) {
      saveHabits(habits);
      return undefined;
    }
    if (same(habits, remote.current)) return undefined;
    const timer = setTimeout(async () => {
      remote.current = habits;
      try {
        const cloud = await loadCloud();
        await cloud.writeHabits(uid, habits);
      } catch (err) {
        console.error("Save failed", err);
        setSync("error");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [habits, uid]);

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

  return { habits, sync, addHabit, renameHabit, removeHabit, toggleDay };
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
