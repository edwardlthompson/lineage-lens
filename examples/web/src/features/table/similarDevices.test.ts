import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import { findSimilarDevices, similarityScore } from "./similarDevices";

function stub(partial: Partial<Device> & { id: string; name: string }): Device {
  return {
    codename: partial.id,
    vendor: "Test",
    models: [],
    type: "phone",
    versions: [],
    maintainers: [],
    status: "current",
    cameras: [
      {
        type: "main",
        sensor_size_mm: 12,
        pixel_pitch_um: 1.2,
        aperture: 1.8,
        ois: true,
        mp: 50,
      },
    ],
    aggregates: { main_sensor_size: 12, max_optical_zoom: 3 },
    scores: {},
    provenance: { data_sources: [], quality: "enriched", last_updated: "2020-01-01" },
    release_year: 2024,
    ...partial,
  };
}

describe("similarDevices", () => {
  it("scores near clones higher than distant specs", () => {
    const seed = stub({ id: "seed", name: "Seed", release_year: 2024 });
    const twin = stub({
      id: "twin",
      name: "Twin",
      release_year: 2024,
      aggregates: { main_sensor_size: 12.1, max_optical_zoom: 3 },
    });
    const far = stub({
      id: "far",
      name: "Far",
      release_year: 2018,
      cameras: [{ type: "main", sensor_size_mm: 6, mp: 12 }],
      aggregates: { main_sensor_size: 6, max_optical_zoom: 1 },
    });
    expect(similarityScore(seed, twin)).toBeGreaterThan(similarityScore(seed, far));
  });

  it("returns top similar excluding the seed", () => {
    const seed = stub({ id: "seed", name: "Seed" });
    const pool = [
      seed,
      stub({ id: "a", name: "A", aggregates: { main_sensor_size: 12, max_optical_zoom: 3 } }),
      stub({ id: "b", name: "B", aggregates: { main_sensor_size: 11.5, max_optical_zoom: 2.5 } }),
    ];
    const hits = findSimilarDevices(seed, pool, 3, 40);
    expect(hits.every((h) => h.id !== "seed")).toBe(true);
    expect(hits.length).toBeGreaterThan(0);
  });
});
