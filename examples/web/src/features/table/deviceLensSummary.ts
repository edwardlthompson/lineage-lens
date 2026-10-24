import { bitrateScore, blurScore, lensWeight, oisStabScore, pixelPitchScore } from "./lensScoring";

type LensStackRow = {
  type: string;
  sensorDiagMm: number | null;
  lensScore: number | null;
  pixelPitchUm: number | null;
  blurIndex: number | null;
  maxBitrateMbps?: number | null;
  ois?: boolean | null;
};

export function totalSensorGeometry(lenses: Pick<LensStackRow, "sensorDiagMm">[]): {
  totalSensorDiagMm: number;
  totalSensorAreaMm2: number;
} {
  let totalSensorDiagMm = 0;
  let totalSensorAreaMm2 = 0;
  for (const L of lenses) {
    if (L.sensorDiagMm == null) continue;
    totalSensorDiagMm += L.sensorDiagMm;
    totalSensorAreaMm2 += L.sensorDiagMm * 0.8 * L.sensorDiagMm * 0.6;
  }
  return { totalSensorDiagMm, totalSensorAreaMm2 };
}

/** Sum of per-camera max bitrates (Mbps) — system video throughput. */
export function overallBitrateMbps(lenses: Pick<LensStackRow, "maxBitrateMbps">[]): number | null {
  let sum = 0;
  let any = false;
  for (const L of lenses) {
    if (L.maxBitrateMbps == null || L.maxBitrateMbps <= 0) continue;
    sum += L.maxBitrateMbps;
    any = true;
  }
  return any ? Math.round(sum) : null;
}

/** Bitrate dominates; resolution and frame rate are not part of this score. */
export function overallLensScore(lenses: LensStackRow[]): number | null {
  let num = 0;
  let den = 0;
  let hasMain = false;
  for (const L of lenses) {
    const w = lensWeight(L.type);
    num += (L.lensScore ?? 0) * w;
    den += w;
    if ((L.type === "main" || L.type === "wide") && L.lensScore != null) hasMain = true;
  }
  if (den <= 0 || !hasMain) return null;
  const stack = num / den;
  const br = overallBitrateScoreFromLenses(lenses);
  if (br == null) return stack;
  return stack * 0.25 + br * 0.75;
}

function weightedLensMetric<T extends { type: string }>(
  lenses: T[],
  scoreOf: (l: T) => number | null,
): number | null {
  let num = 0;
  let den = 0;
  for (const L of lenses) {
    const s = scoreOf(L);
    if (s == null) continue;
    const w = lensWeight(L.type);
    num += s * w;
    den += w;
  }
  return den > 0 ? num / den : null;
}

export function overallPixelPitchFromLenses(lenses: LensStackRow[]): number | null {
  return weightedLensMetric(lenses, (L) => pixelPitchScore(L.pixelPitchUm));
}

export function overallBlurFromLenses(lenses: LensStackRow[]): number | null {
  return weightedLensMetric(lenses, (L) => blurScore(L.blurIndex));
}

/** Weighted mean of per-lens OIS scores (100 or 0). */
export function overallStabFromLenses(lenses: LensStackRow[]): number | null {
  if (!lenses.length) return null;
  return weightedLensMetric(lenses, (L) => oisStabScore(L.ois));
}

/** Weighted mean of per-lens bitrate scores (0–100). */
export function overallBitrateScoreFromLenses(lenses: LensStackRow[]): number | null {
  return weightedLensMetric(lenses, (L) => bitrateScore(L.maxBitrateMbps));
}
