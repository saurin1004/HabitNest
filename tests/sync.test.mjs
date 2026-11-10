// Multi-device sync tests (Node test runner) against the Firestore emulator:  npm run test:rules
// Each "device" is a separate Firestore client signed in as the same user.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { serverTimestamp, setDoc, doc } from "firebase/firestore";
import { readHabits, sendChange, writeAll } from "../src/lib/sync.js";

let env;
const device = () => env.authenticatedContext("alice", { email_verified: true }).firestore();
const names = (habits) => habits.map((h) => h.name);
const habit = (id, name) => ({ id, name, completions: [] });

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-habitnest",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
beforeEach(() => env.clearFirestore());
after(() => env.cleanup());

describe("multi-device sync", () => {
  it("keeps changes made on two devices at the same time", async () => {
    const laptop = device();
    const phone = device();
    await writeAll(laptop, "alice", [habit("a", "Workout"), habit("b", "Read")]);

    // Neither device sees the other's change before making its own.
    await Promise.all([
      sendChange(laptop, "alice", { type: "toggle", id: "a", day: "2026-11-09", done: true }),
      sendChange(phone, "alice", { type: "rename", id: "b", name: "Read 20 pages" }),
      sendChange(phone, "alice", { type: "add", id: "c", name: "Stretch", order: 2 }),
    ]);

    const { habits } = await readHabits(device(), "alice");
    assert.deepEqual(names(habits), ["Workout", "Read 20 pages", "Stretch"]);
    assert.deepEqual(habits[0].completions, ["2026-11-09"]);
  });

  it("a device with an out-of-date list can't wipe a habit added elsewhere", async () => {
    const laptop = device();
    const phone = device();
    await writeAll(laptop, "alice", [habit("a", "Workout")]);
    await readHabits(phone, "alice"); // phone now holds the old list

    await sendChange(laptop, "alice", { type: "add", id: "b", name: "Meditate", order: 1 });
    await sendChange(phone, "alice", { type: "toggle", id: "a", day: "2026-11-09", done: true });

    const { habits } = await readHabits(device(), "alice");
    assert.deepEqual(names(habits), ["Workout", "Meditate"]);
    assert.deepEqual(habits[0].completions, ["2026-11-09"]);
  });

  it("a habit deleted on one device stays deleted after a late check-in elsewhere", async () => {
    const laptop = device();
    const phone = device();
    await writeAll(laptop, "alice", [habit("a", "Workout"), habit("b", "Read")]);

    await sendChange(laptop, "alice", { type: "remove", id: "a" });
    await sendChange(phone, "alice", { type: "toggle", id: "a", day: "2026-11-09", done: true });

    const { habits } = await readHabits(device(), "alice");
    assert.deepEqual(names(habits), ["Read"]);
  });

  it("unticking removes only that day", async () => {
    const db = device();
    await writeAll(db, "alice", [{ id: "a", name: "Workout", completions: ["2026-11-08", "2026-11-09"] }]);
    await sendChange(db, "alice", { type: "toggle", id: "a", day: "2026-11-09", done: false });
    const { habits } = await readHabits(db, "alice");
    assert.deepEqual(habits[0].completions, ["2026-11-08"]);
  });

  it("moving a habit changes only its position", async () => {
    const db = device();
    await writeAll(db, "alice", [habit("a", "A"), habit("b", "B"), habit("c", "C")]);
    await sendChange(db, "alice", { type: "move", id: "c", order: 0.5 }); // between A (0) and B (1)
    assert.deepEqual(names((await readHabits(db, "alice")).habits), ["A", "C", "B"]);
  });
});

describe("reading an account", () => {
  it("reports a missing account as known and empty", async () => {
    assert.deepEqual(await readHabits(device(), "alice"), { known: true, exists: false });
  });

  it("reads and flags documents in the original list format", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "users/alice"), {
        habits: [habit("a", "Workout"), habit("b", "Read")],
        updatedAt: serverTimestamp(),
      })
    );
    const stored = await readHabits(device(), "alice");
    assert.equal(stored.legacy, true);
    assert.deepEqual(names(stored.habits), ["Workout", "Read"]);

    // Converting keeps everything, in the same order.
    await writeAll(device(), "alice", stored.habits);
    const converted = await readHabits(device(), "alice");
    assert.equal(converted.legacy, false);
    assert.deepEqual(names(converted.habits), ["Workout", "Read"]);
  });
});
