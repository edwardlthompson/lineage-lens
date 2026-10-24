import { describe, expect, it } from "vitest";
import { cellularTier, cellularTierRank, meetsCellularFilter } from "./cellularTier";

describe("cellularTier", () => {
  it("maps 5G NR ahead of 4G", () => {
    expect(cellularTier(["2G GSM", "3G UMTS", "4G LTE", "5G NR"])).toBe("5G");
  });

  it("maps LTE / 4G to 4G", () => {
    expect(cellularTier(["2G GSM", "3G UMTS", "4G LTE"])).toBe("4G");
    expect(cellularTier(["LTE"])).toBe("4G");
  });

  it("maps Wi-Fi-only and empty to dash", () => {
    expect(cellularTier(["None"])).toBe("—");
    expect(cellularTier([])).toBe("—");
    expect(cellularTier(null)).toBe("—");
  });

  it("maps 2G/3G-only to dash", () => {
    expect(cellularTier(["2G GSM", "3G UMTS"])).toBe("—");
  });

  it("ranks 5G above 4G above dash", () => {
    expect(cellularTierRank("5G")).toBeGreaterThan(cellularTierRank("4G"));
    expect(cellularTierRank("4G")).toBeGreaterThan(cellularTierRank("—"));
  });

  it("filters 5G exact and 4G as 4G-or-better", () => {
    expect(meetsCellularFilter("5G", "5G")).toBe(true);
    expect(meetsCellularFilter("4G", "5G")).toBe(false);
    expect(meetsCellularFilter("—", "5G")).toBe(false);
    expect(meetsCellularFilter("5G", "4G")).toBe(true);
    expect(meetsCellularFilter("4G", "4G")).toBe(true);
    expect(meetsCellularFilter("—", "4G")).toBe(false);
    expect(meetsCellularFilter("—", "")).toBe(true);
  });
});
