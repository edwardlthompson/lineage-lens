import { describe, expect, it } from "vitest";
import { estimateWiredWatts, estimateWirelessWatts, inferQiProtocol } from "./chargeEstimate";

describe("chargeEstimate", () => {
  it("infers Qi1 vs Qi2", () => {
    expect(inferQiProtocol("qi wireless charging", 2022, "Xiaomi")).toBe("Qi1");
    expect(inferQiProtocol("qi2 wireless", 2024, "Samsung")).toBe("Qi2");
    expect(inferQiProtocol("qi wireless charging", 2025, "OnePlus")).toBe("Qi2");
    expect(inferQiProtocol("qi wireless charging", 2025, "Google")).toBe("Qi1");
    expect(inferQiProtocol("stereo speakers", 2025, "OnePlus")).toBeNull();
  });

  it("scales wired watts with capacity and vendor", () => {
    const mid = estimateWiredWatts(5000, 2023, "Fairphone");
    const big = estimateWiredWatts(7300, 2025, "OnePlus");
    const pixel = estimateWiredWatts(4700, 2024, "Google");
    expect(mid).toBe(65);
    expect(big!).toBeGreaterThan(mid!);
    expect(pixel!).toBeLessThanOrEqual(30);
  });

  it("gives Qi2 higher wireless watts than Qi1", () => {
    expect(estimateWirelessWatts("Qi2", 5000)).toBe(25);
    expect(estimateWirelessWatts("Qi1", 5000)).toBe(15);
  });
});
