import { describe, expect, it } from "vitest";
import { normalizeSocBlob, socPerformanceTier } from "./performanceTieBreak";

describe("socPerformanceTier", () => {
  it("ranks the newest flagships above the previous generation", () => {
    const elite5 = socPerformanceTier("Qualcomm SM8850 Snapdragon 8 Elite Gen 5");
    const elite = socPerformanceTier("Qualcomm SM8750 Snapdragon 8 Elite");
    const gen3 = socPerformanceTier("Qualcomm SM8650 Snapdragon 8 Gen3");
    const gen2 = socPerformanceTier("Qualcomm SM8550 Snapdragon 8 Gen2");
    const plus = socPerformanceTier("Qualcomm SM8475 Snapdragon 8+ Gen1");
    const g5 = socPerformanceTier("Google Tensor G5");
    const g4 = socPerformanceTier("Google Tensor G4");
    const tensor = socPerformanceTier("Google Tensor GS101");
    expect(elite5).toBeGreaterThan(elite);
    expect(elite).toBeGreaterThan(gen3);
    expect(gen3).toBeGreaterThan(gen2);
    expect(gen2).toBeGreaterThan(plus);
    expect(g5).toBeGreaterThan(g4);
    expect(g4).toBeGreaterThan(tensor);
    expect(socPerformanceTier("Qualcomm SM7550-AB Snapdragon 7 Gen 3")).toBeGreaterThan(20);
    expect(socPerformanceTier("Qualcomm SM8150-AC Snapdragon 860")).toBeGreaterThan(
      socPerformanceTier("Qualcomm SM8150 Snapdragon 855"),
    );
  });

  it("scores TV / STB Amlogic and Tegra chips above the unknown fallback", () => {
    expect(socPerformanceTier("Amlogic S905X4")).toBeGreaterThan(
      socPerformanceTier("Amlogic S905Y2"),
    );
    expect(socPerformanceTier("Amlogic S905Y2")).toBeGreaterThan(20);
    expect(socPerformanceTier("Amlogic S905X")).toBeGreaterThan(20);
    expect(socPerformanceTier("NVIDIA Tegra X1+ (T210b01)")).toBeGreaterThan(
      socPerformanceTier("NVIDIA Tegra X1 (T210)"),
    );
    expect(socPerformanceTier("NVIDIA Tegra X2 (T186)")).toBeGreaterThan(
      socPerformanceTier("NVIDIA Tegra K1 (T124)"),
    );
    expect(socPerformanceTier("Intel Atom Z3560")).toBeGreaterThan(20);
  });

  it("scores gaming SoCs (QCS8550, G3x, Tegra) above unknown fallback", () => {
    expect(socPerformanceTier("Qualcomm QCS8550")).toBe(88);
    expect(socPerformanceTier("Qualcomm SM8350 Snapdragon G3x Gen 1")).toBe(85);
    expect(socPerformanceTier("Qualcomm SDM845 Snapdragon 845")).toBe(70);
    expect(socPerformanceTier("Qualcomm CQ8725S")).toBeGreaterThan(20);
    expect(socPerformanceTier("NVIDIA Tegra 4 (T114)")).toBeGreaterThan(20);
  });

  it("scores legacy Exynos / Kirin / OMAP above unknown fallback", () => {
    expect(socPerformanceTier("Samsung Exynos 990")).toBe(78);
    expect(socPerformanceTier("Samsung Exynos 7420")).toBeGreaterThan(20);
    expect(socPerformanceTier("HiSilicon Kirin 970")).toBeGreaterThan(
      socPerformanceTier("HiSilicon Kirin 659"),
    );
    expect(socPerformanceTier("TI OMAP4460")).toBeGreaterThan(20);
    expect(socPerformanceTier("Qualcomm APQ8064 Snapdragon S4 Pro")).toBeGreaterThan(20);
  });

  it("normalizes dual-SKU soc arrays", () => {
    expect(normalizeSocBlob(["Intel Atom Z3560", "Intel Atom Z3580"])).toContain("Z3560");
    expect(
      socPerformanceTier(["Intel Atom Z3560", "Intel Atom Z3580"] as unknown as string),
    ).toBeGreaterThan(20);
  });
});
