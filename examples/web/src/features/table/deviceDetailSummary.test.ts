import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import { buildDetailFields, detailHeadline } from "./deviceDetailSummary";

function stub(
  partial: Partial<Device> & Pick<Device, "id" | "codename" | "vendor" | "name">,
): Device {
  return {
    models: [],
    type: "phone",
    versions: [],
    maintainers: [],
    status: "current",
    cameras: [],
    aggregates: {},
    scores: {},
    provenance: { data_sources: ["wiki"], quality: "wiki_only", last_updated: "2026-01-01" },
    ...partial,
  };
}

describe("deviceDetailSummary", () => {
  it("builds headline and core fields", () => {
    const d = stub({
      id: "x",
      codename: "enchilada",
      vendor: "OnePlus",
      name: "6",
      lineage_label: "22.2",
      release_year: 2018,
      soc: "SDM845",
      ram: "8 GB",
      scores: { camera_score: 40, worth_buying_score: 55 },
      aggregates: { has_ois_main: true, max_optical_zoom: 2 },
    });
    expect(detailHeadline(d)).toBe("OnePlus 6");
    const keys = buildDetailFields(d).map((f) => f.labelKey);
    expect(keys).toContain("detail.field.codename");
    expect(keys).toContain("detail.field.ois");
    expect(keys).toContain("detail.field.zoom");
  });
});
