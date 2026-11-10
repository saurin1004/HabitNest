import { describe, expect, it } from "vitest";
import { isPristine, mergeHabits } from "./merge.js";
import { DEFAULT_HABITS, starterHabits } from "./storage.js";

describe("mergeHabits", () => {
  it("keeps account habits and adds habits that only exist locally", () => {
    const remote = [{ id: "r1", name: "Workout", completions: ["2026-03-01"] }];
    const local = [{ id: "l1", name: "Read", completions: ["2026-03-02"] }];
    expect(mergeHabits(remote, local)).toEqual([
      { id: "r1", name: "Workout", completions: ["2026-03-01"] },
      { id: "l1", name: "Read", completions: ["2026-03-02"] },
    ]);
  });

  it("combines check-ins for the same habit matched by id", () => {
    const remote = [{ id: "a", name: "Workout", completions: ["2026-03-01", "2026-03-03"] }];
    const local = [{ id: "a", name: "Gym", completions: ["2026-03-02", "2026-03-03"] }];
    expect(mergeHabits(remote, local)).toEqual([
      { id: "a", name: "Workout", completions: ["2026-03-01", "2026-03-02", "2026-03-03"] },
    ]);
  });

  it("matches the same habit by name when ids differ", () => {
    const remote = [{ id: "r", name: "Workout", completions: ["2026-03-01"] }];
    const local = [{ id: "l", name: "  workout ", completions: ["2026-03-02"] }];
    expect(mergeHabits(remote, local)).toHaveLength(1);
    expect(mergeHabits(remote, local)[0].completions).toEqual(["2026-03-01", "2026-03-02"]);
  });

  it("does not modify its inputs", () => {
    const remote = [{ id: "a", name: "Workout", completions: ["2026-03-01"] }];
    const local = [{ id: "a", name: "Workout", completions: ["2026-03-02"] }];
    mergeHabits(remote, local);
    expect(remote[0].completions).toEqual(["2026-03-01"]);
  });
});

describe("isPristine", () => {
  it("is true for the untouched starter list", () => {
    expect(isPristine(starterHabits(), DEFAULT_HABITS)).toBe(true);
  });
  it("is false once anything is checked off or changed", () => {
    const habits = starterHabits();
    habits[0].completions.push("2026-03-01");
    expect(isPristine(habits, DEFAULT_HABITS)).toBe(false);
    expect(isPristine(starterHabits().slice(1), DEFAULT_HABITS)).toBe(false);
  });
});
