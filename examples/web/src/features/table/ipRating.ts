/** IP filter tiers shown in the Data table (minimum rating). */
export const IP_FILTER_TIERS = [
  { value: "64", label: "IP64+" },
  { value: "65", label: "IP65+" },
  { value: "68", label: "IP68+" },
  { value: "69", label: "IP69+" },
] as const;

export type IpFilterTier = (typeof IP_FILTER_TIERS)[number]["value"];

/**
 * Parse dust + liquid digits from waterproofing text (e.g. IP68, IPX8, IP69K).
 * Dust `X` means unknown — only the liquid digit is usable for thresholds.
 */
export function parseIpDigits(
  raw: string | null | undefined,
): { dust: number | null; water: number } | null {
  if (!raw) return null;
  const m = String(raw).match(/IP\s*([0-6X])\s*([0-9])/i);
  if (!m) return null;
  const dustRaw = m[1].toUpperCase();
  const water = Number(m[2]);
  if (!Number.isFinite(water)) return null;
  const dust = dustRaw === "X" ? null : Number(dustRaw);
  return { dust, water };
}

/** True when waterproofing meets or exceeds an IP## minimum (e.g. 68 → IP68+). */
export function meetsIpMin(raw: string | null | undefined, minCode: number): boolean {
  const parsed = parseIpDigits(raw);
  if (!parsed) return false;
  const minDust = Math.floor(minCode / 10);
  const minWater = minCode % 10;
  if (parsed.dust == null) {
    // IPXn — only liquid digit is certified; require water ≥ min water digit.
    return parsed.water >= minWater && minDust <= 6;
  }
  return parsed.dust >= minDust && parsed.water >= minWater;
}
