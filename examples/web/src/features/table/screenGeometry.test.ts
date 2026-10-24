import { describe, expect, it } from "vitest";
import {
  flattenScreen,
  formatPpi,
  formatResolution,
  formatSize,
  formatTech,
  panelTechClass,
  parseResolution,
  resolutionUxDelta,
  screenPpi,
  screenSizeInches,
} from "./screenGeometry";

describe("screenGeometry", () => {
  it("parses WxH resolution", () => {
    expect(parseResolution("3840x2160")).toEqual({ w: 3840, h: 2160 });
    expect(parseResolution("1080×2400")).toEqual({ w: 1080, h: 2400 });
    expect(parseResolution("bad")).toBeNull();
  });

  it("flattens nested wiki screen bags", () => {
    const flat = flattenScreen({
      screen: { resolution: "1440x3200", size: 6.7, technology: "AMOLED" },
      refresh_rate: 120,
    });
    expect(flat.resolution).toBe("1440x3200");
    expect(flat.size).toBe(6.7);
    expect(flat.refresh_rate).toBe(120);
  });

  it("computes PPI from resolution + size", () => {
    expect(screenPpi({ resolution: "1440x3200", size: 6.1 })).toBeGreaterThan(500);
    expect(screenPpi({ resolution: "3840x2160", size: 55 })).toBeLessThan(100);
    expect(screenPpi({ resolution: "3840x2160" })).toBeNull();
  });

  it("classifies OLED vs LCD tech", () => {
    expect(panelTechClass("Super AMOLED")).toBe("oled");
    expect(panelTechClass("POLED")).toBe("oled");
    expect(panelTechClass("IPS LCD")).toBe("lcd");
    expect(panelTechClass("LTPS TFT")).toBe("lcd");
    expect(panelTechClass(null)).toBeNull();
  });

  it("formats empty as dash", () => {
    expect(formatResolution(null)).toBe("—");
    expect(formatSize({})).toBe("—");
    expect(formatPpi({ resolution: "1080x2400" })).toBe("—");
    expect(formatTech({})).toBe("—");
    expect(screenSizeInches({ size: 6.1 })).toBe(6.1);
  });

  it("scores higher max HDMI/panel resolution for TV UX", () => {
    expect(resolutionUxDelta({ resolution: "3840x2160" })).toBe(8);
    expect(resolutionUxDelta({ resolution: "1920x1080" })).toBe(2);
    expect(resolutionUxDelta(null)).toBe(0);
  });
});
