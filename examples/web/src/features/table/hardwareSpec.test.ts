import { describe, expect, it } from "vitest";
import {
  abbreviateSoc,
  formatTopSpecLine,
  topCapacityGb,
} from "./hardwareSpec";
import {
  compareOpticsThenPerformance,
  performanceTieBreakScore,
} from "./performanceTieBreak";

describe("hardwareSpec", () => {
  it("picks top RAM and storage from ranges", () => {
    expect(topCapacityGb("8/12 GB LPDDR5")).toBe(12);
    expect(topCapacityGb("128/256/512 GB UFS3.1")).toBe(512);
    expect(topCapacityGb("1 TB")).toBe(1024);
  });

  it("abbreviates common SoCs", () => {
    expect(abbreviateSoc("Qualcomm SM8550 Snapdragon 8 Gen2")).toBe("SD8G2");
    expect(abbreviateSoc("Qualcomm SDM845 Snapdragon 845")).toBe("SD845");
    expect(abbreviateSoc("Google Tensor G3")).toBe("Tsr G3");
    expect(abbreviateSoc("MediaTek Dimensity 1200")).toBe("D1200");
  });

  it("strips Dragonwing branding to the QC part number", () => {
    expect(abbreviateSoc("Qualcomm Dragonwing™ QCS8550 (QCS8550)")).toBe("QCS8550");
    expect(abbreviateSoc("Qualcomm Dragonwing QCM6490 (QCM6490)")).toBe("QCM6490");
  });

  it("abbreviates Snapdragon 8+/Elite/G variants as SD", () => {
    expect(abbreviateSoc("Qualcomm SM8475 Snapdragon 8+ Gen1")).toBe("SD8+G1");
    expect(abbreviateSoc("Qualcomm SM8750 Snapdragon 8 Elite")).toBe("SD8 Elite");
    expect(abbreviateSoc("Qualcomm SM8850 Snapdragon 8 Elite Gen 5")).toBe("SD8E G5");
    expect(abbreviateSoc("Qualcomm SM7325 Snapdragon 778G 5G")).toBe("SD778G");
    expect(abbreviateSoc("Qualcomm SM7325-AE Snapdragon 778G+ 5G")).toBe("SD778G+");
    expect(abbreviateSoc("Qualcomm SM7475-AB Snapdragon 7+ Gen 2")).toBe("SD7+G2");
    expect(abbreviateSoc("Qualcomm SM8635 Snapdragon 8s Gen3")).toBe("SD8sG3");
  });

  it("formats a compact top-spec line", () => {
    expect(
      formatTopSpecLine({
        soc: "Qualcomm SM8550 Snapdragon 8 Gen2",
        ram: "8/12 GB LPDDR5",
        storage: "128/256/512 GB",
      }),
    ).toBe("SD8G2 · 12GB · 512GB");
    expect(
      formatTopSpecLine({
        soc: "Qualcomm SM8475 Snapdragon 8+ Gen1",
        ram: "8/12 GB",
        storage: "256/512 GB",
      }),
    ).toBe("SD8+G1 · 12GB · 512GB");
  });

  it("breaks equal optics scores with performance specs", () => {
    const weak = { soc: "Snapdragon 778G", ram: "8 GB", storage: "128 GB" };
    const strong = { soc: "Snapdragon 8 Elite", ram: "16 GB", storage: "512 GB" };
    expect(performanceTieBreakScore(strong)).toBeGreaterThan(performanceTieBreakScore(weak));
    expect(compareOpticsThenPerformance(80, weak, 80, strong)).toBeLessThan(0);
    expect(compareOpticsThenPerformance(90, weak, 80, strong)).toBeGreaterThan(0);
  });
});
