import { topCapacityGb } from "./hardwareSpec";

type PerfDevice = {
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
};

/** SoC tier (0–100). Newer flagships score higher. First match wins. */
const SOC_TIERS: ReadonlyArray<readonly [RegExp, number]> = [
  [/8 elite gen\s*5/, 99],
  [/8 elite/, 96],
  [/8s gen\s*3/, 90],
  [/8 gen\s*3/, 93],
  [/8 gen\s*2/, 88],
  [/8\+\s*gen\s*1/, 86],
  [/8 gen\s*1/, 84],
  [/tensor g5/, 90],
  [/tensor g4/, 86],
  [/tensor g3/, 83],
  [/tensor g2|gs201/, 80],
  [/tensor|gs101/, 76],
  [/7\+\s*gen\s*3/, 82],
  [/7 gen\s*3/, 79],
  [/7\+\s*gen\s*2/, 78],
  [/7s gen\s*3/, 76],
  [/7s gen\s*2/, 74],
  [/888\+/, 83],
  [/888\b/, 81],
  [/870\b/, 79],
  [/865\+/, 78],
  [/865\b/, 76],
  [/860\b/, 75],
  [/855\+/, 74],
  [/855\b/, 73],
  [/6 gen\s*3/, 68],
  [/6s gen\s*3/, 67],
  [/6 gen\s*1/, 64],
  [/4 gen\s*1/, 42],
  [/dimensity\s*9[4-9]\d{2}/, 92],
  [/dimensity\s*9\d{3}/, 86],
  [/dimensity\s*8\d{3}/, 80],
  [/dimensity\s*7\d{3}/, 70],
  [/exynos\s*2[4-9]\d{2}/, 91],
  [/exynos\s*2200/, 82],
  [/exynos\s*9[89]\d{2}/, 72],
  [/exynos\s*850/, 40],
  [/helio g9/, 48],
  [/helio g8/, 42],
  [/helio/, 30],
  [/qcm6490/, 70],
];

/** Rough SoC performance tier (0–100) for UX and optics tie-breaks. */
export function socPerformanceTier(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = String(raw).toLowerCase();
  for (const [re, score] of SOC_TIERS) {
    if (re.test(s)) return score;
  }
  const g = s.match(/snapdragon\s*(\d{3,4})g/);
  if (g) return Math.min(75, Math.round(Number(g[1]) / 12));
  const n = s.match(/snapdragon\s*(\d{3,4})\b/);
  if (n) return Math.min(72, Math.round(Number(n[1]) / 14));
  return 20;
}

/**
 * Scalar for breaking optics ties: SoC tier dominates, then top RAM.
 * Storage omitted — responsiveness model matches deviceUxScore (SoC+RAM only).
 */
export function performanceTieBreakScore(device: PerfDevice): number {
  const tier = socPerformanceTier(device.soc);
  const ram = topCapacityGb(device.ram) ?? 0;
  return tier * 1_000_000 + ram * 1_000;
}

/** Compare optics scores; on equal scores prefer higher performance specs. Nulls sort last. */
export function compareOpticsThenPerformance(
  scoreA: number | null,
  deviceA: PerfDevice,
  scoreB: number | null,
  deviceB: PerfDevice,
): number {
  if (scoreA == null && scoreB == null) return 0;
  if (scoreA == null) return 1;
  if (scoreB == null) return -1;
  if (scoreA !== scoreB) return scoreA < scoreB ? -1 : 1;
  const ta = performanceTieBreakScore(deviceA);
  const tb = performanceTieBreakScore(deviceB);
  return ta < tb ? -1 : ta > tb ? 1 : 0;
}
