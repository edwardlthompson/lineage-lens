import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import {
  analyzeDeviceLenses,
  backgroundBlurIndex,
  fullFrameEquivalentMm,
  lensVideoScore,
  sensorDiagonalMm,
} from "./opticsMath";

const baseDevice: Device = {
  id: "x",
  codename: "x",
  vendor: "Test",
  name: "Test",
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

describe("opticsMath", () => {
  it("derives diagonal from optical format using type-1 (16 mm) inch", () => {
    // 1/1.31" → 16/1.31 ≈ 12.2 mm
    expect(sensorDiagonalMm({ type: "main", optical_format: "1.31" })?.toFixed(1)).toBe("12.2");
    expect(sensorDiagonalMm({ type: "main", optical_format: "1/1.28" })?.toFixed(1)).toBe("12.5");
  });

  it("treats marketing FL >= 12 as already FF-equivalent", () => {
    const { ffEq, trueFl } = fullFrameEquivalentMm(
      { type: "main", focal_length_mm: 24, sensor_size_mm: 12.2 },
      12.2,
    );
    expect(ffEq).toBe(24);
    expect(trueFl).not.toBeNull();
    expect(trueFl!).toBeLessThan(10);
  });

  it("converts true optical FL < 10 via crop factor", () => {
    const { ffEq, trueFl } = fullFrameEquivalentMm(
      { type: "main", focal_length_mm: 5.1, sensor_size_mm: 12.2 },
      12.2,
    );
    expect(trueFl).toBe(5.1);
    expect(ffEq).toBeGreaterThan(15);
  });

  it("computes blur index that rises with sensor and aperture", () => {
    const a = backgroundBlurIndex(12, 1.8, 24)!;
    const b = backgroundBlurIndex(6, 2.4, 24)!;
    expect(a).toBeGreaterThan(b);
  });

  it("sums sensor diagonals including front and scores lenses", () => {
    const device: Device = {
      ...baseDevice,
      video: { "4k": { "30": true, "60": true }, "1080p": { "30": true, "60": true } },
      cameras: [
        {
          type: "main",
          sensor_size_mm: 12.2,
          optical_format: "1.31",
          pixel_pitch_um: 1.2,
          focal_length_mm: 24,
          aperture: 1.7,
          ois: true,
          sensor_model: "GN2",
        },
        {
          type: "ultrawide",
          sensor_size_mm: 8,
          focal_length_mm: 13,
          aperture: 2.2,
          sensor_model: "IMX712",
        },
        {
          type: "front",
          sensor_size_mm: 5.5,
          focal_length_mm: 20,
          aperture: 2.2,
          sensor_model: "IMX616",
        },
      ],
    };
    const a = analyzeDeviceLenses(device);
    expect(a.lenses).toHaveLength(3);
    expect(a.totalSensorDiagMm).toBeCloseTo(12.2 + 8 + 5.5, 1);
    expect(a.overallScore).not.toBeNull();
    expect(a.lenses[0].lensScore!).toBeGreaterThan(a.lenses[2].lensScore!);
    expect(a.lenses[0].focalFfEqMm).toBe(24);
    expect(a.lenses[0].sensorModel).toBe("GN2");
  });

  it("extrapolates size and pitch from sensor part number alone", () => {
    const device: Device = {
      ...baseDevice,
      cameras: [
        { type: "main", sensor_model: "IMX586" },
        { type: "front", sensor_model: "IMX471", mp: 16 },
      ],
    };
    const a = analyzeDeviceLenses(device);
    expect(a.lenses).toHaveLength(2);
    expect(a.lenses[0].sensorDiagMm).toBeCloseTo(8.0, 1);
    expect(a.lenses[0].pixelPitchUm).toBe(0.8);
    expect(a.lenses[1].sensorDiagMm).toBeGreaterThan(4);
    expect(a.totalSensorDiagMm).toBeGreaterThan(8);
    expect(a.lenses[0].lensScore).not.toBeNull();
    expect(a.lenses[1].lensScore).not.toBeNull();
    expect(a.overallPixelPitchScore).not.toBeNull();
    expect(a.overallPixelPitchScore!).toBeGreaterThan(0);
    expect(a.overallBlurScore).toBeNull();
  });

  it("computes overall blur score when aperture and size exist", () => {
    const device: Device = {
      ...baseDevice,
      cameras: [
        {
          type: "main",
          sensor_size_mm: 12.2,
          focal_length_mm: 24,
          aperture: 1.7,
        },
      ],
    };
    const a = analyzeDeviceLenses(device);
    expect(a.overallBlurScore).not.toBeNull();
    expect(a.overallBlurScore!).toBeGreaterThan(0);
  });

  it("ranks enriched berlin above incomplete tucana in live devices.json", async () => {
    const raw = await import("../../../public/data/devices.json");
    const devices =
      (raw as { default?: { devices: Device[] } }).default?.devices ??
      (raw as { devices: Device[] }).devices;
    const tucana = devices.find((d) => d.codename === "tucana")!;
    const berlin = devices.find((d) => d.codename === "berlin")!;
    const t = analyzeDeviceLenses(tucana);
    const b = analyzeDeviceLenses(berlin);
    expect(t.overallScore).toBeNull();
    expect(b.overallScore).not.toBeNull();
    expect(b.overallScore!).toBeGreaterThan(0);
  });

  it("does not let incomplete stacks outrank fully specified optics", () => {
    const incomplete: Device = {
      ...baseDevice,
      cameras: [
        { type: "main", mp: 108, info: "108 MP" },
        { type: "telephoto", mp: 12 },
        { type: "ultrawide", mp: 20 },
        { type: "macro", mp: 2 },
        {
          type: "front",
          sensor_model: "S5KHMX",
          sensor_size_mm: 12.03,
          pixel_pitch_um: 0.8,
          mp: 32,
        },
      ],
    };
    const complete: Device = {
      ...baseDevice,
      cameras: [
        {
          type: "main",
          sensor_model: "S5KHM2",
          sensor_size_mm: 10.5,
          optical_format: "1/1.52",
          pixel_pitch_um: 0.7,
          focal_length_mm: 24,
          aperture: 1.9,
          ois: false,
          mp: 108,
        },
        {
          type: "ultrawide",
          sensor_size_mm: 5.2,
          pixel_pitch_um: 1.0,
          focal_length_mm: 17,
          aperture: 2.2,
          ois: false,
        },
        {
          type: "telephoto",
          sensor_size_mm: 3.6,
          pixel_pitch_um: 1.0,
          focal_length_mm: 79,
          aperture: 2.4,
          ois: true,
        },
        {
          type: "front",
          sensor_size_mm: 5.7,
          pixel_pitch_um: 0.7,
          focal_length_mm: 28,
          aperture: 2.2,
        },
      ],
    };
    const a = analyzeDeviceLenses(incomplete);
    const b = analyzeDeviceLenses(complete);
    // Incomplete main → no overall (selfie fragment alone must not rank)
    expect(a.overallScore).toBeNull();
    expect(b.overallScore).not.toBeNull();
    expect(b.overallScore!).toBeGreaterThan(0);
  });

  it("boosts video score when 4K reaches 120fps+", () => {
    const at60 = lensVideoScore("main", {
      "4k": { "30": true, "60": true },
      "1080p": { "30": true, "60": true },
    });
    const at120 = lensVideoScore("main", {
      "4k": { "30": true, "60": true, "120": true },
      "1080p": { "30": true, "60": true },
    });
    expect(at120.score!).toBeGreaterThan(at60.score!);
    expect(at120.score! - at60.score!).toBeGreaterThanOrEqual(10);
  });

  it("raises lens overall score when blur potential is higher", () => {
    const weak: Device = {
      ...baseDevice,
      cameras: [
        {
          type: "main",
          sensor_size_mm: 6,
          focal_length_mm: 24,
          aperture: 2.4,
          pixel_pitch_um: 1.0,
          ois: true,
        },
      ],
    };
    const strong: Device = {
      ...baseDevice,
      cameras: [
        {
          type: "main",
          sensor_size_mm: 15,
          focal_length_mm: 24,
          aperture: 1.6,
          pixel_pitch_um: 1.0,
          ois: true,
        },
      ],
    };
    const a = analyzeDeviceLenses(weak);
    const b = analyzeDeviceLenses(strong);
    expect(b.lenses[0].blurIndex!).toBeGreaterThan(a.lenses[0].blurIndex!);
    expect(b.overallBlurScore!).toBeGreaterThan(a.overallBlurScore!);
    expect(b.overallScore!).toBeGreaterThan(a.overallScore!);
    expect(b.lenses[0].lensScore!).toBeGreaterThan(a.lenses[0].lensScore!);
  });
});
