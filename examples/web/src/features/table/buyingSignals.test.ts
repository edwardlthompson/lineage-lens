import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import {
  cameraGaps,
  formatProVideoBadges,
  mainSensorRank,
  proVideoFlags,
  slowMoCeilingFps,
  zoomReachX,
} from "./buyingSignals";

function stub(partial: Partial<Device>): Device {
  return {
    id: "t",
    codename: "t",
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
    provenance: { data_sources: [], quality: "enriched", last_updated: "2020-01-01" },
    ...partial,
  };
}

describe("buyingSignals", () => {
  it("ranks main sensor from diag/pitch/OIS", () => {
    const d = stub({
      cameras: [
        {
          type: "main",
          sensor_size_mm: 12,
          pixel_pitch_um: 1.4,
          ois: true,
          mp: 50,
        },
      ],
    });
    const r = mainSensorRank(d);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(50);
  });

  it("reads zoom reach and slow-mo ceiling", () => {
    const d = stub({
      cameras: [{ type: "telephoto", zoom: 5, mp: 10 }],
      aggregates: { max_optical_zoom: 5 },
      video: { "1080p": { "960": true, "60": true } },
    });
    expect(zoomReachX(d)).toBe(5);
    expect(slowMoCeilingFps(d)).toBe(960);
  });

  it("detects pro video flags and gaps", () => {
    const d = stub({
      cameras: [{ type: "main", mp: 12, ois: false }],
      video: { "4k": { "60": true, "10 Bit": true, Dolby: true } },
      aggregates: {},
    });
    const flags = proVideoFlags(d);
    expect(flags.k4_60).toBe(true);
    expect(flags.tenBit).toBe(true);
    expect(formatProVideoBadges(flags)).toContain("DV");
    expect(cameraGaps(d)).toContain("no_main_ois");
    expect(cameraGaps(d)).toContain("no_ultrawide");
  });
});
