import { topCapacityGb } from "./hardwareSpec";

type PerfDevice = {
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
};

/** Rough SoC performance tier (0–100) for optics tie-breaks. */
export function socPerformanceTier(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = String(raw).toLowerCase();

  if (/8 elite gen\s*5/.test(s)) return 99;
  if (/8 elite/.test(s)) return 97;
  if (/8s gen\s*3/.test(s)) return 91;
  if (/8 gen\s*3/.test(s)) return 93;
  if (/8\+\s*gen\s*1/.test(s)) return 90;
  if (/8 gen\s*2/.test(s)) return 88;
  if (/8 gen\s*1/.test(s)) return 85;
  if (/7\+\s*gen\s*3/.test(s)) return 82;
  if (/7\+\s*gen\s*2/.test(s)) return 80;
  if (/7s gen\s*3/.test(s)) return 78;
  if (/7s gen\s*2/.test(s)) return 76;
  if (/6s gen\s*3/.test(s)) return 70;

  if (/tensor g4|gs201/.test(s)) return 87;
  if (/tensor g3/.test(s)) return 84;
  if (/tensor g2/.test(s)) return 81;
  if (/tensor/.test(s)) return 78;

  if (/dimensity\s*9\d{3}/.test(s)) return 86;
  if (/dimensity\s*8\d{3}/.test(s)) return 80;
  if (/dimensity\s*7\d{3}/.test(s)) return 72;

  if (/888\+/.test(s)) return 83;
  if (/888\b/.test(s)) return 82;
  if (/870\b/.test(s)) return 79;
  if (/865\+/.test(s)) return 78;
  if (/865\b/.test(s)) return 77;
  if (/855\+/.test(s)) return 74;
  if (/855\b/.test(s)) return 73;

  const g = s.match(/snapdragon\s*(\d{3,4})g/);
  if (g) return Math.min(75, Number(g[1]) / 12);

  const n = s.match(/snapdragon\s*(\d{3,4})\b/);
  if (n) return Math.min(72, Number(n[1]) / 14);

  if (/exynos\s*2[2-4]\d{2}/.test(s)) return 84;
  if (/exynos\s*21\d{2}/.test(s)) return 80;

  return 20;
}

/**
 * Scalar for breaking optics ties: SoC tier dominates, then top RAM, then storage.
 */
export function performanceTieBreakScore(device: PerfDevice): number {
  const tier = socPerformanceTier(device.soc);
  const ram = topCapacityGb(device.ram) ?? 0;
  const stor = topCapacityGb(device.storage) ?? 0;
  return tier * 1_000_000 + ram * 1_000 + Math.min(stor, 2048);
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
