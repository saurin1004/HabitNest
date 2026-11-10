// Firestore reads and per-change writes for a user's habits.
// Takes the Firestore instance as a parameter so it can be tested against the emulator.
import {
  FieldPath,
  arrayRemove,
  arrayUnion,
  deleteField,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { toArray, toMap } from "./habitDoc.js";

export const userRef = (db, uid) => doc(db, "users", uid);

// Reads from the server first. Falls back to the offline cache only when the
// network is unavailable, and reports `known: false` if neither can answer,
// so callers never mistake "couldn't read" for "no data".
export async function readHabits(db, uid) {
  let snap;
  try {
    snap = await getDocFromServer(userRef(db, uid));
  } catch (err) {
    if (err?.code !== "unavailable") throw err;
    try {
      snap = await getDoc(userRef(db, uid));
    } catch {
      return { known: false };
    }
    if (!snap.exists() && snap.metadata.fromCache) return { known: false };
  }
  if (!snap.exists()) return { known: true, exists: false };
  const stored = snap.data().habits;
  return { known: true, exists: true, habits: toArray(stored), legacy: Array.isArray(stored) };
}

// Replaces everything. Used once: when an account is created or migrated.
export const writeAll = (db, uid, habits) =>
  setDoc(userRef(db, uid), { habits: toMap(habits), updatedAt: serverTimestamp() });

const path = (...parts) => new FieldPath("habits", ...parts);

// Sends a single change. Concurrent changes to other habits or fields are preserved.
export function sendChange(db, uid, change) {
  const fields = [];
  switch (change.type) {
    case "add":
      fields.push(path(change.id), { name: change.name, order: change.order, completions: [] });
      break;
    case "rename":
      fields.push(path(change.id, "name"), change.name);
      break;
    case "remove":
      fields.push(path(change.id), deleteField());
      break;
    case "toggle":
      fields.push(path(change.id, "completions"), change.done ? arrayUnion(change.day) : arrayRemove(change.day));
      break;
    case "move":
      fields.push(path(change.id, "order"), change.order);
      break;
    default:
      throw new Error(`Unknown change ${change.type}`);
  }
  return updateDoc(userRef(db, uid), ...fields, new FieldPath("updatedAt"), serverTimestamp());
}

// Calls back with (habits, hasPendingWrites) whenever the account's habits change.
export const watchHabits = (db, uid, callback, onError) =>
  onSnapshot(
    userRef(db, uid),
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.exists()) callback(toArray(snap.data().habits), snap.metadata.hasPendingWrites);
    },
    onError
  );
