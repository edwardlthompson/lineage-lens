import type { Device } from "../../types/device";

export type SensorBin = { label: string; count: number; minMm: number; maxMm: number };

export type YearScatterPoint = {
  id: string;
  year: number;
  sensorMm: number;
  name: string;
};

function mainSensorMm(d: Device): number | null {
  const fromAgg = d.aggregates.main_sensor_size;
  if (fromAgg != null && fromAgg > 0) return fromAgg;
  const main = d.cameras.find((c) => c.type === "main" || c.type === "wide");
  if (main?.sensor_size_mm != null && main.sensor_size_mm > 0) return main.sensor_size_mm;
  return null;
}

const BINS: { label: string; minMm: number; maxMm: number }[] = [
  { label: "<8mm", minMm: 0, maxMm: 8 },
  { label: "8–10", minMm: 8, maxMm: 10 },
  { label: "10–12", minMm: 10, maxMm: 12 },
  { label: "12–14", minMm: 12, maxMm: 14 },
  { label: "14+", minMm: 14, maxMm: 99 },
];

export function sensorSizeBins(devices: Device[]): SensorBin[] {
  const counts = BINS.map((b) => ({ ...b, count: 0 }));
  for (const d of devices) {
    const mm = mainSensorMm(d);
    if (mm == null) continue;
    const bin = counts.find((b) => mm >= b.minMm && mm < b.maxMm);
    if (bin) bin.count += 1;
  }
  return counts;
}

export function yearSensorScatter(devices: Device[]): YearScatterPoint[] {
  const out: YearScatterPoint[] = [];
  for (const d of devices) {
    const year = d.release_year;
    const sensorMm = mainSensorMm(d);
    if (year == null || sensorMm == null) continue;
    out.push({ id: d.id, year, sensorMm, name: `${d.vendor} ${d.name}`.trim() });
  }
  return out;
}
