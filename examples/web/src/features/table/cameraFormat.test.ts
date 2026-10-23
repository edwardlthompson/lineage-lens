import { describe, expect, it } from "vitest";
import {
  cameraHasHardwareSpecs,
  cameraTypeLabel,
  enabledFrameRates,
  formatCameraHardwareLine,
  formatOpticalFormat,
  lensRoleFromInfo,
  meaningfulCameras,
  summarizeVideo,
} from "./cameraFormat";
import type { CameraModule } from "../../types/device";

describe("cameraFormat", () => {
  it("abbreviates ultrawide as UW", () => {
    expect(cameraTypeLabel("ultrawide")).toBe("UW");
    expect(cameraTypeLabel("telephoto")).toBe("Tele");
  });

  it("formats optical format denominators as 1/x\"", () => {
    expect(formatOpticalFormat("1.31")).toBe('1/1.31"');
    expect(formatOpticalFormat("1/1.28")).toBe("1/1.28");
  });

  it("ignores megapixels and flash None when judging hardware richness", () => {
    const mpOnly: CameraModule = { type: "main", mp: 108 };
    expect(cameraHasHardwareSpecs(mpOnly)).toBe(false);
    const flashNone: CameraModule = { type: "front", flash: "None", mp: 16 };
    expect(cameraHasHardwareSpecs(flashNone)).toBe(false);
    const rich: CameraModule = { type: "main", sensor_size_mm: 12.2, ois: true };
    expect(cameraHasHardwareSpecs(rich)).toBe(true);
  });

  it("keeps wiki modules and drops empty tele stubs", () => {
    const cams: CameraModule[] = [
      { type: "main", sensor_size_mm: 12.2, ois: true },
      { type: "telephoto", ois: false },
      { type: "main", mp: 13, flash: "LED", info: "13 MP" },
      { type: "ultrawide", mp: 8, info: "8 MP (ultra-wide angle)" },
    ];
    const kept = meaningfulCameras(cams);
    expect(kept).toHaveLength(3);
    expect(kept.some((c) => c.type === "telephoto")).toBe(false);
  });

  it("lists hardware without megapixels", () => {
    const line = formatCameraHardwareLine({
      type: "telephoto",
      mp: 48,
      optical_format: "2.55",
      sensor_size_mm: 6.3,
      pixel_pitch_um: 0.7,
      focal_length_mm: 120,
      ois: true,
      zoom: 5,
    });
    expect(line).toContain("6.3 mm");
    expect(line).toContain("5× zoom");
    expect(line).toContain("OIS");
    expect(line).not.toMatch(/\b48\b/);
    expect(line).not.toMatch(/MP/i);
  });

  it("uses wiki lens role instead of raw MP info", () => {
    expect(lensRoleFromInfo("50 MP (wide angle)")).toBe("wide angle");
    const line = formatCameraHardwareLine({
      type: "ultrawide",
      mp: 8,
      info: "8 MP (ultra-wide angle)",
      flash: "Dual LED (dual tone)",
    });
    expect(line).toContain("ultra-wide");
    expect(line).toContain("Dual LED");
    expect(line).not.toMatch(/MP/i);
  });

  it("summarizes video fps and HDR flags", () => {
    const s = summarizeVideo({
      "1080p": { "30": true, "60": true, "24": false },
      "4k": { "30": true, "60": true, HDR: false, "10 Bit": true },
    });
    expect(s.p1080).toBe("1080p @ 30/60 fps");
    expect(s.p4k).toBe("4K @ 30/60 fps");
    expect(s.features).toContain("10 Bit");
    expect(enabledFrameRates({ "120": true, HDR: true })).toEqual([120]);
  });
});
