import type { Device } from "../../types/device";
import { performanceTieBreakScore } from "./performanceTieBreak";
import { analyzeDeviceLenses, type LensOptics } from "./opticsMath";

export type LensMetricKey =
  | "sensorDiagMm"
  | "pixelPitchUm"
  | "blurIndex"
  | "lensScore"
  | "videoScore"
  | "focalFfEqMm";

export type CategoryKey =
  | "totalSensorDiagMm"
  | "overallPixelPitchScore"
  | "overallBlurScore"
  | "overallScore";

export type CompareWins = {
  /** Device ids that tie for each category aggregate. */
  category: Record<CategoryKey, Set<string>>;
  /** Per camera type → metric → winning device ids. */
  lens: Record<string, Partial<Record<LensMetricKey, Set<string>>>>;
};

const CATEGORY_KEYS: CategoryKey[] = [
  "totalSensorDiagMm",
  "overallPixelPitchScore",
  "overallBlurScore",
  "overallScore",
];

const LENS_METRICS: LensMetricKey[] = [
  "sensorDiagMm",
  "pixelPitchUm",
  "blurIndex",
  "lensScore",
  "videoScore",
  "focalFfEqMm",
];

function maxWinners(
  entries: { id: string; value: number | null; tieBreak: number }[],
): Set<string> {
  let best = -Infinity;
  let bestTb = -Infinity;
  const winners = new Set<string>();
  for (const e of entries) {
    if (e.value == null || Number.isNaN(e.value)) continue;
    if (e.value > best || (e.value === best && e.tieBreak > bestTb)) {
      best = e.value;
      bestTb = e.tieBreak;
      winners.clear();
      winners.add(e.id);
    } else if (e.value === best && e.tieBreak === bestTb) {
      winners.add(e.id);
    }
  }
  return winners;
}

/** Compute which devices lead each comparable metric among `devices`. */
export function computeCompareWins(devices: Device[]): CompareWins {
  const analyses = devices.map((d) => ({
    id: d.id,
    device: d,
    a: analyzeDeviceLenses(d),
    tieBreak: performanceTieBreakScore(d),
  }));

  const category = {} as CompareWins["category"];
  for (const key of CATEGORY_KEYS) {
    category[key] = maxWinners(
      analyses.map(({ id, a, tieBreak }) => ({
        id,
        tieBreak,
        value:
          key === "totalSensorDiagMm"
            ? a.totalSensorDiagMm > 0
              ? a.totalSensorDiagMm
              : null
            : a[key],
      })),
    );
  }

  const types = new Set<string>();
  for (const { a } of analyses) {
    for (const L of a.lenses) types.add(L.type);
  }

  const lens: CompareWins["lens"] = {};
  for (const typ of types) {
    const byMetric: Partial<Record<LensMetricKey, Set<string>>> = {};
    for (const metric of LENS_METRICS) {
      byMetric[metric] = maxWinners(
        analyses.map(({ id, a, tieBreak }) => {
          const L = a.lenses.find((x) => x.type === typ) as LensOptics | undefined;
          const value = L ? (L[metric] as number | null) : null;
          return { id, value, tieBreak };
        }),
      );
    }
    lens[typ] = byMetric;
  }

  return { category, lens };
}

export function emptyWins(): CompareWins {
  return {
    category: {
      totalSensorDiagMm: new Set(),
      overallPixelPitchScore: new Set(),
      overallBlurScore: new Set(),
      overallScore: new Set(),
    },
    lens: {},
  };
}
