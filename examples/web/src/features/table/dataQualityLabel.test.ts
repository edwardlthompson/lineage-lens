import { describe, expect, it } from "vitest";
import { countDataQuality, countDataQualityStats, dataQualityLabelKey } from "./dataQualityLabel";

describe("dataQualityLabel", () => {
  it("maps quality to i18n keys", () => {
    expect(dataQualityLabelKey("complete")).toBe("table.quality.complete");
    expect(dataQualityLabelKey("partial")).toBe("table.quality.partial");
    expect(dataQualityLabelKey("wiki_only")).toBe("table.quality.wiki_only");
    expect(dataQualityLabelKey("enriched")).toBe("table.quality.enriched");
  });

  it("counts tiers in the filtered set", () => {
    const counts = countDataQuality([
      { provenance: { quality: "complete" } },
      { provenance: { quality: "complete" } },
      { provenance: { quality: "partial" } },
      { provenance: { quality: "wiki_only" } },
    ]);
    expect(counts).toEqual({
      complete: 2,
      enriched: 0,
      partial: 1,
      wiki_only: 1,
    });
  });

  it("rolls enriched into complete and wiki_only into partial for stats", () => {
    expect(
      countDataQualityStats([
        { provenance: { quality: "complete" } },
        { provenance: { quality: "enriched" } },
        { provenance: { quality: "partial" } },
        { provenance: { quality: "wiki_only" } },
      ]),
    ).toEqual({ complete: 2, partial: 2 });
  });
});
