import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import { chargeUxScore, formatChargeLines, parseChargeHints } from "./chargeSignals";
import { audioHints, cameraMaturityScore, usedMarketProxy } from "./marketSignals";

function stub(partial: Partial<Device>): Device {
  return {
    id: "t",
    codename: "t",
    vendor: "Test",
    name: "Test",
    models: ["SM-A525F", "SM-A525M"],
    type: "phone",
    versions: [],
    maintainers: ["a", "b"],
    status: "current",
    cameras: [],
    aggregates: {},
    scores: { longevity_score: 80 },
    provenance: { data_sources: [], quality: "complete", last_updated: "2020-01-01" },
    ...partial,
  };
}

describe("marketSignals", () => {
  it("scores newer devices higher for used-market proxy", () => {
    const newish = usedMarketProxy(stub({ release_year: 2025 }));
    const old = usedMarketProxy(stub({ release_year: 2018 }));
    expect(newish!).toBeGreaterThan(old!);
  });

  it("parses charge and audio hints", () => {
    const d = stub({
      battery: { capacity: 5000 },
      peripherals: ["65W charging", "Qi2 wireless 50W", "stereo speakers"],
      release_year: 2024,
      vendor: "Xiaomi",
    });
    const c = parseChargeHints(d);
    expect(c.capacityMah).toBe(5000);
    expect(c.wiredWatts).toBe(65);
    expect(c.wirelessWatts).toBe(50);
    expect(c.qiVersion).toBe("Qi2");
    expect(c.wireless).toBe(true);
    expect(formatChargeLines(c)).toEqual(["5000 mAh", "65W wired", "Qi2 · 50W"]);
    expect(chargeUxScore(c)).toBeGreaterThan(50);
    expect(audioHints(d)).toContain("stereo");
  });

  it("uses published catalog rates and leaves unknown watts as --", () => {
    const op12 = parseChargeHints(
      stub({
        codename: "waffle",
        vendor: "OnePlus",
        name: "12",
        battery: { capacity: 5400 },
      }),
    );
    expect(op12.wiredWatts).toBe(100);
    expect(op12.wirelessWatts).toBe(50);
    expect(op12.wireless).toBe(true);
    expect(formatChargeLines(op12)).toEqual(["5400 mAh", "100W wired", "50W"]);

    const unknown = parseChargeHints(
      stub({
        battery: { capacity: 4820 },
        peripherals: ["Qi wireless charging"],
      }),
    );
    expect(unknown.wiredWatts).toBeNull();
    expect(unknown.wirelessWatts).toBeNull();
    expect(formatChargeLines(unknown)).toEqual(["4820 mAh", "--", "Qi1"]);
  });

  it("penalizes confirmed absence of wireless charging", () => {
    const withWl = chargeUxScore(
      parseChargeHints(stub({ codename: "waffle", battery: { capacity: 5400 } })),
    );
    const noWl = chargeUxScore(
      parseChargeHints(stub({ codename: "salami", battery: { capacity: 5000 } })),
    );
    expect(withWl).not.toBeNull();
    expect(noWl).not.toBeNull();
    expect(withWl!).toBeGreaterThan(noWl!);
  });

  it("computes camera maturity from longevity × quality", () => {
    const m = cameraMaturityScore(stub({}));
    expect(m).not.toBeNull();
    expect(m!).toBeGreaterThan(50);
  });
});
