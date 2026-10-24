import { describe, expect, it } from "vitest";
import {
  deviceUxScore,
  ramSpeedDelta,
  ramUxScore,
  storageUxDelta,
  totalRankScore,
} from "./deviceUxScore";

describe("deviceUxScore", () => {
  it("scores Elite + 16GB higher than mid SoC + 8GB", () => {
    const flagship = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12/16 GB",
    });
    const mid = deviceUxScore({
      soc: "Snapdragon 778G",
      ram: "8 GB",
    });
    expect(flagship).not.toBeNull();
    expect(mid).not.toBeNull();
    expect(flagship!).toBeGreaterThan(mid!);
  });

  it("returns null when SoC and RAM are missing", () => {
    expect(deviceUxScore({})).toBeNull();
    expect(deviceUxScore({ soc: "", ram: null })).toBeNull();
  });

  it("maps RAM tiers", () => {
    expect(ramUxScore(4)).toBe(25);
    expect(ramUxScore(8)).toBe(55);
    expect(ramUxScore(12)).toBe(75);
    expect(ramUxScore(16)).toBe(90);
    expect(ramUxScore(24)).toBe(100);
  });

  it("folds charge into UX when battery data is present", () => {
    const base = deviceUxScore({ soc: "Snapdragon 8 Elite", ram: "12/16 GB" });
    const withCharge = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12/16 GB",
      battery: { capacity: 5000 },
      peripherals: ["65W charging", "Qi2 wireless 50W"],
    });
    expect(base).not.toBeNull();
    expect(withCharge).not.toBeNull();
    expect(withCharge).not.toBe(base);
  });

  it("treats IP68 as the baseline and moves the score with the rating", () => {
    const base = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      waterproofing: "IP68",
    });
    const low = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      waterproofing: "IP54",
    });
    const high = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      waterproofing: "IP69",
    });
    expect(low!).toBeLessThan(base!);
    expect(high!).toBeGreaterThan(base!);
  });

  it("raises UX for faster RAM generations", () => {
    expect(ramSpeedDelta("12 GB LPDDR5X")).toBeGreaterThan(ramSpeedDelta("12 GB LPDDR5"));
    expect(ramSpeedDelta("8 GB LPDDR5")).toBeGreaterThan(ramSpeedDelta("8 GB LPDDR4X"));
    const slow = deviceUxScore({ soc: "Snapdragon 8 Gen 2", ram: "12 GB LPDDR4X" });
    const fast = deviceUxScore({ soc: "Snapdragon 8 Gen 2", ram: "12 GB LPDDR5X" });
    expect(fast!).toBeGreaterThan(slow!);
  });

  it("raises UX for faster storage and higher refresh", () => {
    const base = deviceUxScore({ soc: "Snapdragon 8 Elite", ram: "12 GB" });
    const faster = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      storage: "128 GB UFS 3.1, 256 GB UFS 4.0",
      screen: { refresh_rate: 144 },
    });
    expect(storageUxDelta("256 GB UFS 4.0")).toBeGreaterThan(storageUxDelta("128 GB UFS 3.1"));
    expect(faster!).toBeGreaterThan(base!);
  });

  it("gives UX and camera equal weight in the total", () => {
    expect(totalRankScore(40, 80)).toBe(60);
    expect(totalRankScore(80, 80)).toBeGreaterThan(totalRankScore(30, 95)!);
    expect(totalRankScore(null, 90)).toBeNull();
  });
});
