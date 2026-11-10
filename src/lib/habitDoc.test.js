import { describe, expect, it } from "vitest";
import { nextOrder, orderBetween, toArray, toMap } from "./habitDoc.js";

describe("toMap / toArray", () => {
  const list = [
    { id: "a", name: "Workout", completions: ["2026-11-09", "2026-11-08", "2026-11-09"] },
    { id: "b", name: "Read", completions: [] },
  ];

  it("round-trips, keeping order and de-duplicating check-ins", () => {
    expect(toArray(toMap(list))).toEqual([
      { id: "a", name: "Workout", completions: ["2026-11-08", "2026-11-09"], order: 0 },
      { id: "b", name: "Read", completions: [], order: 1 },
    ]);
  });

  it("reads the original array format", () => {
    expect(toArray(list).map((h) => [h.id, h.order])).toEqual([["a", 0], ["b", 1]]);
  });

  it("sorts by position", () => {
    const map = { x: { name: "X", order: 2, completions: [] }, y: { name: "Y", order: 0.5, completions: [] } };
    expect(toArray(map).map((h) => h.id)).toEqual(["y", "x"]);
  });

  it("ignores leftovers of habits deleted on another device", () => {
    const map = { a: { name: "Kept", order: 0, completions: [] }, gone: { completions: ["2026-11-09"] } };
    expect(toArray(map).map((h) => h.id)).toEqual(["a"]);
  });

  it("handles empty or missing data", () => {
    expect(toArray(undefined)).toEqual([]);
    expect(toArray({})).toEqual([]);
  });
});

describe("ordering", () => {
  it("places items between, before or after neighbours", () => {
    expect(orderBetween(1, 2)).toBe(1.5);
    expect(orderBetween(undefined, 0)).toBe(-1);
    expect(orderBetween(3, undefined)).toBe(4);
    expect(orderBetween(undefined, undefined)).toBe(0);
  });

  it("puts new habits after the last one", () => {
    expect(nextOrder([])).toBe(0);
    expect(nextOrder([{ order: 0 }, { order: 4.5 }])).toBe(5.5);
  });
});
