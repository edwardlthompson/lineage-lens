import { topCapacityGb } from "./hardwareSpec";
import { SOC_PERFORMANCE_TIERS } from "./socPerformanceData";

type PerfDevice = {
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
};

/** Normalize wiki SoC (string or dual-SKU array) for matching. */
export function normalizeSocBlob(raw: unknown): string {
  if (raw == null) return "";
  if (Array.isArray(raw)) {
    return raw
      .map((x) => String(x ?? "").trim())
      .filter(Boolean)
      .join(" ");
  }
  return String(raw).trim();
}

/** Rough SoC performance tier (0–100) for UX and optics tie-breaks. */
export function socPerformanceTier(raw: string | null | undefined | unknown): number {
  const s = normalizeSocBlob(raw).toLowerCase();
  if (!s) return 0;
  for (const [re, score] of SOC_PERFORMANCE_TIERS) {
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
