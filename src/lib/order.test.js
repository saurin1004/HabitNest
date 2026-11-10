import { describe, expect, it } from "vitest";
import { moveById } from "./order.js";

const list = ["a", "b", "c", "d"].map((id) => ({ id }));
const ids = (l) => l.map((h) => h.id).join("");

describe("moveById", () => {
  it("moves an item down", () => {
    expect(ids(moveById(list, "a", "c"))).toBe("bcad");
  });

  it("moves an item up", () => {
    expect(ids(moveById(list, "d", "b"))).toBe("adbc");
  });

  it("moves to the ends", () => {
    expect(ids(moveById(list, "c", "a"))).toBe("cabd");
    expect(ids(moveById(list, "b", "d"))).toBe("acdb");
  });

  it("returns the same array when nothing moves", () => {
    expect(moveById(list, "b", "b")).toBe(list);
    expect(moveById(list, "x", "b")).toBe(list);
  });

  it("does not modify the original", () => {
    moveById(list, "a", "d");
    expect(ids(list)).toBe("abcd");
  });
});
