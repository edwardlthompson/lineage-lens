import { describe, expect, it } from "vitest";
import type { CameraModule, VideoCapabilities } from "../../types/device";
import {
  dcgStatus,
  estimateMaxVideoBitrateMbps,
  formatSensorFeatureSuffix,
} from "./sensorFeatures";

const cam = (partial: Partial<CameraModule>): CameraModule => ({
  type: "main",
  ...partial,
});

describe("estimateMaxVideoBitrateMbps", () => {
  it("uses catalog max_readout_mbps and marks it assumed", () => {
    const r = estimateMaxVideoBitrateMbps(cam({ sensor_model: "IMX989", mp: 50 }), {
      "4k": { "60": true },
    });
    expect(r).not.toBeNull();
    expect(r!.estimated).toBe(true);
    expect(r!.mbps).toBe(2400);
  });

  it("estimates higher bitrate for higher fps / larger MP", () => {
    const video60: VideoCapabilities = { "4k": { "60": true } };
    const video120: VideoCapabilities = { "4k": { "120": true } };
    const small = estimateMaxVideoBitrateMbps(cam({ mp: 12 }), video60);
    const large = estimateMaxVideoBitrateMbps(cam({ mp: 50 }), video60);
    const faster = estimateMaxVideoBitrateMbps(cam({ mp: 50 }), video120);
    expect(small).not.toBeNull();
    expect(large).not.toBeNull();
    expect(faster).not.toBeNull();
    expect(large!.mbps).toBeGreaterThan(small!.mbps);
    expect(faster!.mbps).toBeGreaterThan(large!.mbps);
    expect(large!.estimated).toBe(true);
  });

  it("returns null without mp or video fps", () => {
    expect(estimateMaxVideoBitrateMbps(cam({}), { "4k": { "60": true } })).toBeNull();
    expect(estimateMaxVideoBitrateMbps(cam({ mp: 50 }), {})).toBeNull();
  });
});

describe("dcgStatus", () => {
  it("confirmed when device features say DCG", () => {
    expect(dcgStatus("IMX686", { dcg: true })).toBe("confirmed");
    expect(dcgStatus(null, null, { has_dcg: true })).toBe("confirmed");
  });

  it("sensor_only when catalog marks DCG but device does not", () => {
    expect(dcgStatus("IMX989", {})).toBe("sensor_only");
    expect(dcgStatus("GN2", null)).toBe("sensor_only");
  });

  it("none when neither device nor sensor", () => {
    expect(dcgStatus("IMX686", {})).toBe("none");
    expect(dcgStatus(null, null)).toBe("none");
  });
});

describe("formatSensorFeatureSuffix", () => {
  it("formats est bitrate and DCG?", () => {
    expect(formatSensorFeatureSuffix({ mbps: 900, estimated: true }, "sensor_only")).toBe(
      " · 900 Mbps* · DCG?",
    );
  });

  it("formats catalog bitrate and confirmed DCG", () => {
    expect(formatSensorFeatureSuffix({ mbps: 2400, estimated: false }, "confirmed")).toBe(
      " · 2400 Mbps · DCG",
    );
  });
});
