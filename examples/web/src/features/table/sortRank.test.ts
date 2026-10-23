import { describe, expect, it } from "vitest";
import { compareOpticsThenPerformance } from "./performanceTieBreak";
import { rankOrUndefined, sensorTotalOrUndefined } from "./sortRank";

type Row = { id: string; score: number | null | undefined };

/**
 * Mirrors @tanstack/table-core sorted-row compare for one column:
 * sortUndefined:'last' returns before desc invert; then sortingFn; then invert if desc.
 */
function tanstackSort(
  rows: Row[],
  opts: {
    desc: boolean;
    sortUndefined: false | "last";
    getValue: (r: Row) => number | null | undefined;
  },
): string[] {
  const sorted = [...rows];
  sorted.sort((rowA, rowB) => {
    const aValue = opts.getValue(rowA);
    const bValue = opts.getValue(rowB);
    let sortInt = 0;
    if (opts.sortUndefined) {
      const aUndefined = aValue === undefined;
      const bUndefined = bValue === undefined;
      if (aUndefined || bUndefined) {
        if (opts.sortUndefined === "last") return aUndefined ? 1 : -1;
      }
    }
    if (sortInt === 0) {
      sortInt = compareOpticsThenPerformance(
        (aValue ?? null) as number | null,
        {},
        (bValue ?? null) as number | null,
        {},
      );
    }
    if (sortInt !== 0 && opts.desc) sortInt *= -1;
    return sortInt;
  });
  return sorted.map((r) => r.id);
}

describe("sortRank", () => {
  it("maps null/NaN to undefined for TanStack sortUndefined", () => {
    expect(rankOrUndefined(null)).toBeUndefined();
    expect(rankOrUndefined(Number.NaN)).toBeUndefined();
    expect(rankOrUndefined(88)).toBe(88);
    expect(sensorTotalOrUndefined(0)).toBeUndefined();
    expect(sensorTotalOrUndefined(12.4)).toBe(12.4);
  });

  it("smoke: desc + undefined last puts high scores first, unranked last", () => {
    const rows: Row[] = [
      { id: "empty", score: undefined },
      { id: "low", score: 20 },
      { id: "high", score: 95 },
      { id: "mid", score: 60 },
      { id: "also-empty", score: undefined },
    ];
    const order = tanstackSort(rows, {
      desc: true,
      sortUndefined: "last",
      getValue: (r) => rankOrUndefined(r.score),
    });
    expect(order.slice(0, 3)).toEqual(["high", "mid", "low"]);
    expect(order.slice(3).sort()).toEqual(["also-empty", "empty"]);
  });

  it("smoke: null-as-value + desc invert wrongly floats unranked (regression)", () => {
    const rows: Row[] = [
      { id: "empty", score: null },
      { id: "high", score: 95 },
      { id: "low", score: 20 },
    ];
    const broken = tanstackSort(rows, {
      desc: true,
      sortUndefined: false,
      getValue: (r) => r.score,
    });
    expect(broken[0]).toBe("empty");
  });
});
