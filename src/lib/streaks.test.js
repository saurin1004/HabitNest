import { describe, expect, it } from "vitest";
import { addDays, lastNDays, toDateKey } from "./dates.js";
import { bestStreak, completionRate, currentStreak } from "./streaks.js";

const TODAY = "2026-03-10";

describe("dates", () => {
  it("formats local dates as YYYY-MM-DD", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29"); // leap year
  });

  it("lists the last n days, oldest first", () => {
    expect(lastNDays(TODAY, 3)).toEqual(["2026-03-08", "2026-03-09", "2026-03-10"]);
  });
});

describe("currentStreak", () => {
  it("is 0 with no check-ins", () => {
    expect(currentStreak([], TODAY)).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    expect(currentStreak(["2026-03-08", "2026-03-09", "2026-03-10"], TODAY)).toBe(3);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    expect(currentStreak(["2026-03-08", "2026-03-09"], TODAY)).toBe(2);
  });

  it("resets after a missed day", () => {
    expect(currentStreak(["2026-03-07", "2026-03-08"], TODAY)).toBe(0);
    expect(currentStreak(["2026-03-06", "2026-03-08", "2026-03-09", "2026-03-10"], TODAY)).toBe(3);
  });

  it("ignores duplicate and unordered entries", () => {
    expect(currentStreak(["2026-03-10", "2026-03-09", "2026-03-10"], TODAY)).toBe(2);
  });
});

describe("bestStreak", () => {
  it("finds the longest run anywhere in the history", () => {
    const history = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-02-10", "2026-03-10"];
    expect(bestStreak(history)).toBe(4);
  });

  it("handles runs across a month boundary", () => {
    expect(bestStreak(["2026-01-30", "2026-01-31", "2026-02-01"])).toBe(3);
  });

  it("is 0 with no check-ins", () => {
    expect(bestStreak([])).toBe(0);
  });
});

describe("completionRate", () => {
  it("is the share of possible check-ins in the window", () => {
    const habits = [
      { completions: ["2026-03-10", "2026-03-09"] },
      { completions: ["2026-03-10", "2026-02-01"] }, // February is outside the window
    ];
    expect(completionRate(habits, TODAY, 7)).toBeCloseTo(3 / 14);
  });

  it("is 0 when there are no habits", () => {
    expect(completionRate([], TODAY, 7)).toBe(0);
  });
});
