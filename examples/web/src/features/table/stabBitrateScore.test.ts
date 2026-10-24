import { describe, expect, it } from "vitest";
import { overallBitrateScoreFromLenses, overallStabFromLenses } from "./deviceLensSummary";
import { bitrateScore, oisStabScore } from "./lensScoring";

describe("stab and bitrate scores", () => {
  it("scores OIS at 100 and everything else at 0", () => {
    expect(oisStabScore(true)).toBe(100);
    expect(oisStabScore(false)).toBe(0);
    expect(oisStabScore(null)).toBe(0);
  });

  it("weights the device stab score toward the main lens", () => {
    const score = overallStabFromLenses([
      {
        type: "main",
        sensorDiagMm: null,
        lensScore: null,
        pixelPitchUm: null,
        blurIndex: null,
        ois: true,
      },
      {
        type: "telephoto",
        sensorDiagMm: null,
        lensScore: null,
        pixelPitchUm: null,
        blurIndex: null,
        ois: false,
      },
    ]);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(50);
    expect(score!).toBeLessThan(100);
  });

  it("averages bitrate scores", () => {
    const hi = bitrateScore(8000);
    const score = overallBitrateScoreFromLenses([
      {
        type: "main",
        sensorDiagMm: null,
        lensScore: null,
        pixelPitchUm: null,
        blurIndex: null,
        maxBitrateMbps: 8000,
      },
    ]);
    expect(score).toBe(hi);
  });
});
