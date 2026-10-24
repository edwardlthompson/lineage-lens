import { describe, expect, it } from "vitest";
import type { Device } from "../../types/device";
import { sensorSizeBins, yearSensorScatter } from "./chartData";

function stub(partial: Partial<Device>): Device {
  return {
    id: "t",
    codename: "t",
    vendor: "Test",
    name: "Phone",
    models: [],
    type: "phone",
    versions: [],
    maintainers: [],
    status: "current",
    cameras: [],
    aggregates: {},
    scores: {},
    provenance: { data_sources: [], quality: "enriched", last_updated: "2020-01-01" },
    ...partial,
  };
}

describe("chartData", () => {
  it("bins main sensor sizes and builds year scatter", () => {
    const devices = [
      stub({
        id: "a",
        release_year: 2024,
        aggregates: { main_sensor_size: 12.5 },
      }),
      stub({
        id: "b",
        release_year: 2022,
        aggregates: { main_sensor_size: 9 },
      }),
    ];
    const bins = sensorSizeBins(devices);
    expect(bins.find((b) => b.label === "12–14")?.count).toBe(1);
    expect(bins.find((b) => b.label === "8–10")?.count).toBe(1);
    expect(yearSensorScatter(devices)).toHaveLength(2);
  });
});
