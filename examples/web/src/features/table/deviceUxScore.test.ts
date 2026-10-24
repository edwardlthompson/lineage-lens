import { describe, expect, it } from "vitest";
import {
  deviceUxScore,
  panelTechUxDelta,
  ppiUxDelta,
  ramSpeedDelta,
  ramUxScore,
  resolutionUxDelta,
  softCeilingUx,
  softExtras,
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

  it("raises UX for higher PPI and OLED (LCD neutral)", () => {
    expect(ppiUxDelta({ resolution: "1440x3200", size: 6.1 })).toBeGreaterThan(
      ppiUxDelta({ resolution: "1080x2400", size: 6.7 }),
    );
    expect(panelTechUxDelta({ technology: "AMOLED" })).toBe(3);
    expect(panelTechUxDelta({ technology: "IPS LCD" })).toBe(0);
    const lcd = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      screen: { resolution: "1440x3200", size: 6.1, technology: "IPS LCD" },
    });
    const oled = deviceUxScore({
      soc: "Snapdragon 8 Elite",
      ram: "12 GB",
      screen: { resolution: "1440x3200", size: 6.1, technology: "AMOLED" },
    });
    expect(oled!).toBeGreaterThan(lcd!);
  });

  it("raises TV/box UX for higher max output resolution", () => {
    expect(resolutionUxDelta({ resolution: "3840x2160" })).toBe(8);
    expect(resolutionUxDelta({ resolution: "1920x1080" })).toBe(2);
    expect(resolutionUxDelta({ resolution: "3840x2160" })).toBeGreaterThan(
      resolutionUxDelta({ resolution: "1920x1080" }),
    );
    const base = { soc: "Amlogic S905Y2", ram: "2 GB" };
    const uhd = deviceUxScore({
      ...base,
      type: "set top box",
      screen: { resolution: "3840x2160" },
    });
    const fhd = deviceUxScore({
      ...base,
      type: "set top box",
      screen: { resolution: "1920x1080" },
    });
    expect(uhd!).toBeGreaterThan(fhd!);
    // Phones do not get the TV/box resolution bonus.
    const phone4k = deviceUxScore({
      ...base,
      type: "phone",
      screen: { resolution: "3840x2160" },
    });
    const phoneBase = deviceUxScore({ ...base, type: "phone" });
    expect(phone4k).toBe(phoneBase);
  });

  it("gives UX and camera equal weight in the total", () => {
    expect(totalRankScore(40, 80)).toBe(60);
    expect(totalRankScore(80, 80)).toBeGreaterThan(totalRankScore(30, 95)!);
    expect(totalRankScore(null, 90)).toBeNull();
  });

  it("soft-caps extras and soft-ceilings the top so flagships spread", () => {
    expect(softExtras(0)).toBe(0);
    expect(softExtras(-8)).toBe(-8);
    expect(softExtras(30)).toBeLessThan(12);
    expect(softExtras(30)).toBeGreaterThan(softExtras(10));
    expect(softCeilingUx(80)).toBe(80);
    expect(softCeilingUx(100)).toBeLessThan(100);
    expect(softCeilingUx(120)).toBeGreaterThan(softCeilingUx(100));
    const lean = deviceUxScore({
      soc: "Snapdragon 8 Elite Gen 5",
      ram: "16 GB",
    });
    const loaded = deviceUxScore({
      soc: "Snapdragon 8 Elite Gen 5",
      ram: "16 GB LPDDR5X",
      storage: "512 GB UFS 4.0",
      waterproofing: "IP68",
      screen: {
        refresh_rate: 144,
        resolution: "1440x3200",
        size: 6.1,
        technology: "AMOLED",
      },
      battery: { capacity: 5000 },
      peripherals: ["100W charging"],
    });
    expect(lean!).toBeLessThan(100);
    expect(loaded!).toBeLessThan(100);
    expect(loaded!).toBeGreaterThan(lean!);
  });
});
