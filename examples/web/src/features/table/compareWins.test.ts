import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import { computeCompareWins } from "./compareWins";

const base: Device = {
  id: "a",
  codename: "a",
  vendor: "Test",
  name: "A",
  models: [],
  type: "phone",
  versions: [],
  maintainers: [],
  status: "current",
  cameras: [],
  aggregates: {},
  scores: {},
  provenance: { data_sources: [], quality: "enriched", last_updated: "" },
};

describe("computeCompareWins", () => {
  it("marks the larger sensor and higher overall as winners", () => {
    const small: Device = {
      ...base,
      id: "small",
      cameras: [
        {
          type: "main",
          sensor_size_mm: 6,
          focal_length_mm: 24,
          aperture: 2.4,
          pixel_pitch_um: 0.8,
          ois: false,
        },
      ],
    };
    const big: Device = {
      ...base,
      id: "big",
      cameras: [
        {
          type: "main",
          sensor_size_mm: 15,
          focal_length_mm: 24,
          aperture: 1.6,
          pixel_pitch_um: 1.4,
          ois: true,
        },
      ],
    };
    const wins = computeCompareWins([small, big]);
    expect(wins.category.totalSensorDiagMm.has("big")).toBe(true);
    expect(wins.category.totalSensorDiagMm.has("small")).toBe(false);
    expect(wins.category.overallScore.has("big")).toBe(true);
    expect(wins.lens.main?.sensorDiagMm?.has("big")).toBe(true);
    expect(wins.lens.main?.blurIndex?.has("big")).toBe(true);
  });

  it("ties share the win highlight when performance also matches", () => {
    const cam = {
      type: "main" as const,
      sensor_size_mm: 10,
      focal_length_mm: 24,
      aperture: 1.8,
      pixel_pitch_um: 1.0,
      ois: true,
    };
    const a: Device = {
      ...base,
      id: "a",
      cameras: [cam],
      soc: "Snapdragon 8 Gen 2",
      ram: "12 GB",
      storage: "256 GB",
    };
    const b: Device = {
      ...base,
      id: "b",
      name: "B",
      cameras: [{ ...cam }],
      soc: "Snapdragon 8 Gen 2",
      ram: "12 GB",
      storage: "256 GB",
    };
    const wins = computeCompareWins([a, b]);
    expect(wins.category.totalSensorDiagMm.has("a")).toBe(true);
    expect(wins.category.totalSensorDiagMm.has("b")).toBe(true);
  });

  it("breaks optics score ties with stronger performance specs", () => {
    const cam = {
      type: "main" as const,
      sensor_size_mm: 10,
      focal_length_mm: 24,
      aperture: 1.8,
      pixel_pitch_um: 1.0,
      ois: true,
    };
    const weak: Device = {
      ...base,
      id: "weak",
      cameras: [cam],
      soc: "Qualcomm SM7325 Snapdragon 778G 5G",
      ram: "8 GB",
      storage: "128 GB",
    };
    const strong: Device = {
      ...base,
      id: "strong",
      name: "Strong",
      cameras: [{ ...cam }],
      soc: "Qualcomm SM8750 Snapdragon 8 Elite",
      ram: "16 GB",
      storage: "512 GB",
    };
    const wins = computeCompareWins([weak, strong]);
    expect(wins.category.totalSensorDiagMm.has("strong")).toBe(true);
    expect(wins.category.totalSensorDiagMm.has("weak")).toBe(false);
    expect(wins.category.overallScore.has("strong")).toBe(true);
    expect(wins.category.overallScore.has("weak")).toBe(false);
    expect(wins.lens.main?.blurIndex?.has("strong")).toBe(true);
    expect(wins.lens.main?.blurIndex?.has("weak")).toBe(false);
  });
});
