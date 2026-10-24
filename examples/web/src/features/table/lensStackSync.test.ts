import { describe, expect, it } from "vitest";
import { maxHeightsByIndex } from "./lensStackSync";

describe("maxHeightsByIndex", () => {
  it("takes the max height per lens index across columns", () => {
    expect(
      maxHeightsByIndex([
        [10, 20, 12],
        [14, 18, 30],
        [11, 22],
      ]),
    ).toEqual([14, 22, 30]);
  });

  it("handles empty input", () => {
    expect(maxHeightsByIndex([])).toEqual([]);
  });
});
