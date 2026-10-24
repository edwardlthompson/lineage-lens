/** Cellular radio tier for table display / filter (tablets & phones). */

export type CellularTier = "5G" | "4G" | "—";

/** Dropdown filter values: 5G = exact; 4G = 4G or better (includes 5G). */
export const CELLULAR_FILTER_TIERS = [
  { value: "5G", label: "5G" },
  { value: "4G", label: "4G+" },
] as const;

export type CellularFilterValue = (typeof CELLULAR_FILTER_TIERS)[number]["value"];

/** Map wiki `network[]` to 5G / 4G / — (Wi‑Fi-only and 2G/3G-only → —). */
export function cellularTier(network: string[] | null | undefined): CellularTier {
  const blob = (network ?? []).join(" ").toUpperCase();
  if (!blob.trim() || blob === "NONE") return "—";
  if (/\b5G\b/.test(blob)) return "5G";
  if (/\b4G\b/.test(blob) || /\bLTE\b/.test(blob)) return "4G";
  return "—";
}

/** Sort rank: 5G > 4G > — */
export function cellularTierRank(tier: CellularTier): number {
  if (tier === "5G") return 3;
  if (tier === "4G") return 2;
  return 1;
}

/**
 * Filter match: `5G` → 5G only; `4G` → 4G or 5G (4G+).
 * Empty filterValue → pass all.
 */
export function meetsCellularFilter(
  tier: CellularTier,
  filterValue: string | null | undefined,
): boolean {
  if (!filterValue) return true;
  if (filterValue === "5G") return tier === "5G";
  if (filterValue === "4G") return tier === "4G" || tier === "5G";
  return tier === filterValue;
}
