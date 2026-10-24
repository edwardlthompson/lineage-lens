import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import {
  flashClass,
  hasHlgVideo,
  hasLogVideo,
  lensStabLabel,
  stabilizationClass,
} from "./cameraCapabilities";

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

describe("cameraCapabilities", () => {
  it("classifies stab hybrid when OIS + EIS", () => {
    expect(
      stabilizationClass(
        stub({
          cameras: [{ type: "main", ois: true, mp: 12 }],
          camera_features: { eis: true },
        }),
      ),
    ).toBe("hybrid");
  });

  it("labels per-lens stab as EIS/OIS/Both/None", () => {
    expect(lensStabLabel(true, true)).toBe("Both");
    expect(lensStabLabel(true, false)).toBe("OIS");
    expect(lensStabLabel(false, true)).toBe("EIS");
    expect(lensStabLabel(null, false)).toBe("None");
  });

  it("classifies flash dual-tone", () => {
    expect(flashClass("Dual-LED dual-tone")).toBe("dual_tone");
    expect(flashClass("none")).toBe("none");
  });

  it("detects Log / HLG from features", () => {
    expect(hasLogVideo({ log_video: true })).toBe(true);
    expect(hasLogVideo({ notes: "CineLog support" })).toBe(true);
    expect(hasHlgVideo({ hlg: true })).toBe(true);
    expect(hasHlgVideo(null, "HLG recording")).toBe(true);
  });
});
