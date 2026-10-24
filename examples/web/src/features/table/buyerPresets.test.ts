import { describe, expect, it } from "vitest";
import { applyBuyerPreset, BUYER_PRESETS } from "./buyerPresets";

describe("buyerPresets", () => {
  it("defines four packs with primary sorts", () => {
    expect(Object.keys(BUYER_PRESETS)).toEqual(["portrait", "travel", "creator", "night"]);
    expect(BUYER_PRESETS.portrait.sorting[0]?.id).toBe("blur_score");
    expect(BUYER_PRESETS.creator.sorting[0]?.id).toBe("overall_score");
  });

  it("applyBuyerPreset returns null for empty", () => {
    expect(applyBuyerPreset("")).toBeNull();
    expect(applyBuyerPreset("portrait")?.sorting[0]?.desc).toBe(true);
  });
});
