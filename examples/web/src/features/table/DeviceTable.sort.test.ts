import { describe, expect, it } from "vitest";
import { SORT_DESC_FIRST_IDS } from "./DeviceTable";

describe("SORT_DESC_FIRST_IDS", () => {
  it("starts metric columns high→low so best scores land on top", () => {
    expect(SORT_DESC_FIRST_IDS.has("overall_score")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("pp_score")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("blur_score")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("total_sensor")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("release_year")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("ux_score")).toBe(true);
    expect(SORT_DESC_FIRST_IDS.has("storage")).toBe(false);
  });

  it("leaves text identity columns on default asc-first", () => {
    expect(SORT_DESC_FIRST_IDS.has("vendor")).toBe(false);
    expect(SORT_DESC_FIRST_IDS.has("name")).toBe(false);
    expect(SORT_DESC_FIRST_IDS.has("codename")).toBe(false);
  });

  it("metric columns use undefined ranks so sortUndefined can pin empties last", async () => {
    const { rankOrUndefined } = await import("./sortRank");
    expect(rankOrUndefined(null)).toBeUndefined();
  });
});
