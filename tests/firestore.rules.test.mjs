// Security-rule tests (Node test runner) against the Firestore emulator:  npm run test:rules
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";

let env;
const habits = { a: { name: "Workout", order: 0, completions: ["2026-03-10"] } };
const valid = () => ({ habits, updatedAt: serverTimestamp() });

const alice = () => env.authenticatedContext("alice", { email_verified: true }).firestore();
const bob = () => env.authenticatedContext("bob", { email_verified: true }).firestore();
const unverified = () => env.authenticatedContext("alice", { email_verified: false }).firestore();
const guest = () => env.unauthenticatedContext().firestore();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-habitnest",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
beforeEach(() => env.clearFirestore());
after(() => env.cleanup());

describe("owner access", () => {
  it("lets a verified user create, read, update and delete their own doc", async () => {
    const ref = doc(alice(), "users/alice");
    await assertSucceeds(setDoc(ref, valid()));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(setDoc(ref, valid()));
    await assertSucceeds(deleteDoc(ref));
  });
});

describe("isolation between users", () => {
  beforeEach(() =>
    env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), "users/alice"), valid()))
  );

  it("blocks reading someone else's habits", async () => {
    await assertFails(getDoc(doc(bob(), "users/alice")));
  });
  it("blocks writing someone else's habits", async () => {
    await assertFails(setDoc(doc(bob(), "users/alice"), valid()));
  });
  it("blocks deleting someone else's habits", async () => {
    await assertFails(deleteDoc(doc(bob(), "users/alice")));
  });
  it("blocks signed-out visitors", async () => {
    await assertFails(getDoc(doc(guest(), "users/alice")));
    await assertFails(setDoc(doc(guest(), "users/alice"), valid()));
  });
  it("blocks accounts whose email isn't verified", async () => {
    await assertFails(getDoc(doc(unverified(), "users/alice")));
    await assertFails(setDoc(doc(unverified(), "users/alice"), valid()));
  });
});

describe("write validation", () => {
  const ref = () => doc(alice(), "users/alice");

  it("rejects unexpected fields", async () => {
    await assertFails(setDoc(ref(), { ...valid(), isAdmin: true }));
  });
  it("rejects a missing habits list", async () => {
    await assertFails(setDoc(ref(), { updatedAt: serverTimestamp() }));
  });
  it("rejects habits that aren't a map", async () => {
    await assertFails(setDoc(ref(), { habits: "nope", updatedAt: serverTimestamp() }));
  });
  it("rejects the old list format", async () => {
    await assertFails(setDoc(ref(), { habits: [{ id: "a", name: "x", completions: [] }], updatedAt: serverTimestamp() }));
  });
  it("rejects more than 100 habits", async () => {
    const many = Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`h${i}`, { name: "x", order: i, completions: [] }]));
    await assertFails(setDoc(ref(), { habits: many, updatedAt: serverTimestamp() }));
  });
  it("allows converting an old list-format document to the map format", async () => {
    await env.withSecurityRulesDisabled((ctx) =>
      setDoc(doc(ctx.firestore(), "users/alice"), { habits: [{ id: "a", name: "x", completions: [] }], updatedAt: serverTimestamp() })
    );
    await assertSucceeds(getDoc(ref()));
    await assertSucceeds(setDoc(ref(), valid()));
  });
  it("rejects client-chosen timestamps", async () => {
    await assertFails(setDoc(ref(), { habits, updatedAt: Timestamp.fromDate(new Date(2020, 0, 1)) }));
  });
});

describe("other collections", () => {
  it("are closed to everyone", async () => {
    await assertFails(getDoc(doc(alice(), "admin/config")));
    await assertFails(setDoc(doc(alice(), "anything/else"), { a: 1 }));
  });
});
