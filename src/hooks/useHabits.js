import { useCallback, useEffect, useRef, useState } from "react";
import { clearGuestHabits, loadHabits, makeHabit, markDeviceLinked, saveHabits } from "../lib/storage.js";
import { toDateKey } from "../lib/dates.js";
import { moveById } from "../lib/order.js";
import { nextOrder, orderBetween } from "../lib/habitDoc.js";
import { loadCloud } from "./useAccount.js";

// Habit state.
//  - Signed out: kept in localStorage on this device.
//  - Signed in: the account in Firestore is the source of truth. Every edit is
//    applied locally at once and sent as a single small change, so edits from
//    other devices merge instead of overwriting each other.
export function useHabits(uid) {
  // `owner` says whose habits these are (null = guest), so a guest list is
  // never saved into an account and an account's list is never saved to this device.
  const [state, setState] = useState(() => ({ owner: null, habits: loadHabits() }));
  // "local" | "loading" | "synced" | "pending" | "error"
  const [sync, setSync] = useState(uid ? "loading" : "local");
  const current = useRef(state);
  current.current = state;

  // Connect to the account when a verified user signs in; go back to guest mode on sign-out.
  useEffect(() => {
    if (!uid) {
      setState({ owner: null, habits: loadHabits() });
      setSync("local");
      return undefined;
    }

    setSync("loading");
    let unwatch = () => {};
    let cancelled = false;

    (async () => {
      try {
        const cloud = await loadCloud();
        const stored = await cloud.readHabits(uid);
        if (cancelled) return;
        if (!stored.known) {
          // Couldn't reach the account and nothing is cached: don't guess, just
          // wait for the live listener to deliver the real data.
          setSync("pending");
        } else {
          // A brand-new account starts from what the guest had on this device.
          // An existing account always wins: guest changes made while signed out
          // are never merged into it, so nothing deleted can come back.
          let initial = stored.exists ? stored.habits : loadHabits();
          const needsWrite = !stored.exists || stored.legacy; // create, or convert the old format
          if (needsWrite) {
            initial = initial.map((h, i) => ({ ...h, order: i }));
            await cloud.writeAll(uid, initial);
          }
          markDeviceLinked();
          clearGuestHabits();
          if (cancelled) return;
          setState({ owner: uid, habits: initial });
          setSync("synced");
        }

        unwatch = cloud.watchHabits(
          uid,
          (habits, pending) => {
            setState({ owner: uid, habits });
            setSync(pending ? "pending" : "synced");
          },
          (err) => {
            console.error("Sync failed", err);
            setSync("error");
          }
        );
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

  // Guests: keep localStorage in step with the list.
  useEffect(() => {
    if (!uid && state.owner === null) saveHabits(state.habits);
  }, [state, uid]);

  // Applies a change locally right away and, when signed in, sends it to the account.
  const apply = useCallback(
    (nextHabits, change) => {
      const { owner } = current.current;
      setState({ owner, habits: nextHabits });
      if (owner && change) {
        loadCloud()
          .then((cloud) => cloud.sendChange(owner, change))
          .catch((err) => {
            console.error("Save failed", err);
            setSync("error");
          });
      }
    },
    []
  );

  const addHabit = useCallback(
    (name) => {
      if (!name.trim()) return;
      const habits = current.current.habits;
      const habit = { ...makeHabit(name), order: nextOrder(habits) };
      apply([...habits, habit], { type: "add", id: habit.id, name: habit.name, order: habit.order });
    },
    [apply]
  );

  const renameHabit = useCallback(
    (id, name) => {
      if (!name.trim()) return;
      const habits = current.current.habits;
      apply(
        habits.map((h) => (h.id === id ? { ...h, name: name.trim() } : h)),
        { type: "rename", id, name: name.trim() }
      );
    },
    [apply]
  );

  const removeHabit = useCallback(
    (id) => {
      apply(current.current.habits.filter((h) => h.id !== id), { type: "remove", id });
    },
    [apply]
  );

  const moveHabit = useCallback(
    (activeId, overId) => {
      const habits = current.current.habits;
      const moved = moveById(habits, activeId, overId);
      if (moved === habits) return;
      const i = moved.findIndex((h) => h.id === activeId);
      const order = orderBetween(moved[i - 1]?.order, moved[i + 1]?.order);
      apply(
        moved.map((h) => (h.id === activeId ? { ...h, order } : h)),
        { type: "move", id: activeId, order }
      );
    },
    [apply]
  );

  const toggleDay = useCallback(
    (id, dateKey) => {
      const habits = current.current.habits;
      const habit = habits.find((h) => h.id === id);
      if (!habit) return;
      const done = !habit.completions.includes(dateKey);
      apply(
        habits.map((h) =>
          h.id !== id
            ? h
            : {
                ...h,
                completions: done
                  ? [...h.completions, dateKey].sort()
                  : h.completions.filter((d) => d !== dateKey),
              }
        ),
        { type: "toggle", id, day: dateKey, done }
      );
    },
    [apply]
  );

  return {
    habits: state.habits,
    sync: uid ? sync : "local",
    addHabit,
    renameHabit,
    removeHabit,
    toggleDay,
    moveHabit,
  };
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
