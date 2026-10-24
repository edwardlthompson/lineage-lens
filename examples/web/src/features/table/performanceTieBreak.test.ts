import { describe, expect, it } from "vitest";
import { socPerformanceTier } from "./performanceTieBreak";

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
});
