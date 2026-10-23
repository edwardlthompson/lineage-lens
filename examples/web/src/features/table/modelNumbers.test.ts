import { describe, expect, it } from "vitest";
import { naModelScore, primaryEbayModel, sortModelsForNaEbay } from "./modelNumbers";

describe("modelNumbers", () => {
  it("ranks Samsung U/U1 above B global and China 0", () => {
    expect(naModelScore("SM-S911U1")).toBeGreaterThan(naModelScore("SM-S911B"));
    expect(naModelScore("SM-S911U")).toBeGreaterThan(naModelScore("SM-S911B"));
    expect(naModelScore("SM-S911B")).toBeGreaterThan(naModelScore("SM-S9110"));
  });

  it("puts NA models first; falls back to global when no NA", () => {
    expect(sortModelsForNaEbay(["SM-S911B", "SM-S911U1", "SM-S9110"])[0]).toBe("SM-S911U1");
    expect(sortModelsForNaEbay(["2210132C", "2210132G"])[0]).toBe("2210132G");
    expect(primaryEbayModel(["XQ-DQ54", "XQ-DQ72"])).toBe("XQ-DQ54");
    expect(primaryEbayModel(["XQ-BQ62", "XQ-BQ72", "XQ-BQ52"])).toBe("XQ-BQ62");
  });

  it("prefers OnePlus US CPH/LE codes", () => {
    expect(sortModelsForNaEbay(["CPH2581", "CPH2583", "PJD110"])[0]).toBe("CPH2583");
    expect(sortModelsForNaEbay(["LE2110", "LE2115", "LE2113"])[0]).toBe("LE2115");
  });
});
