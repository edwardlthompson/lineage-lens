/**
 * Find devices with similar camera systems (optics + zoom + era).
 */
import type { Device } from "../../types/device";
import { analyzeDeviceLenses } from "./opticsMath";

export type SimilarHit = { id: string; score: number; name: string };

function mainDiag(d: Device): number | null {
  const a = analyzeDeviceLenses(d);
  const main = a.lenses.find((l) => l.type === "main" || l.type === "wide");
  return main?.sensorDiagMm ?? (a.totalSensorDiagMm > 0 ? a.totalSensorDiagMm : null);
}

function zoomX(d: Device): number {
  return d.aggregates.max_optical_zoom ?? 1;
}

/**
 * Similarity 0–100 vs `seed`. Higher = closer camera system.
 * Uses main sensor diag, overall optics score, zoom, and release year.
 */
export function similarityScore(seed: Device, other: Device): number {
  if (seed.id === other.id) return 0;
  const sa = analyzeDeviceLenses(seed);
  const oa = analyzeDeviceLenses(other);
  let parts = 0;
  let weight = 0;

  const sd = mainDiag(seed);
  const od = mainDiag(other);
  if (sd != null && od != null && sd > 0) {
    const rel = 1 - Math.min(1, Math.abs(sd - od) / Math.max(sd, 4));
    parts += rel * 40;
    weight += 40;
  }

  if (sa.overallScore != null && oa.overallScore != null) {
    const rel = 1 - Math.min(1, Math.abs(sa.overallScore - oa.overallScore) / 100);
    parts += rel * 30;
    weight += 30;
  }

  const sz = zoomX(seed);
  const oz = zoomX(other);
  const zRel = 1 - Math.min(1, Math.abs(sz - oz) / Math.max(sz, oz, 1));
  parts += zRel * 15;
  weight += 15;

  const sy = seed.release_year;
  const oy = other.release_year;
  if (sy != null && oy != null) {
    const rel = 1 - Math.min(1, Math.abs(sy - oy) / 8);
    parts += rel * 15;
    weight += 15;
  }

  if (weight <= 0) return 0;
  return Math.round((parts / weight) * 100);
}

/** Top-N similar devices (excludes seed), min score gate. */
export function findSimilarDevices(
  seed: Device,
  pool: Device[],
  limit = 4,
  minScore = 55,
): SimilarHit[] {
  const hits: SimilarHit[] = [];
  for (const d of pool) {
    if (d.id === seed.id) continue;
    const score = similarityScore(seed, d);
    if (score < minScore) continue;
    hits.push({ id: d.id, score, name: d.name });
  }
  hits.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return hits.slice(0, limit);
}
