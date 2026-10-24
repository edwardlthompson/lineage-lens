/** Parse wiki RAM/ROM slash ranges into discrete GB options. */

function toGb(n: number, unit: string): number {
  const u = unit.toUpperCase();
  if (u === "TB") return n * 1024;
  if (u === "MB") return n / 1024;
  return n;
}

/**
 * Capacity tokens from strings like `8/12 GB LPDDR5` or `1 TB`.
 * Requires an explicit unit so DRAM gens (LPDDR5) are ignored.
 */
function parseGbTokens(raw: string): number[] {
  const out: number[] = [];
  const range = raw.match(/(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))+\s*(TB|GB|GiB|MB)\b/i);
  if (range) {
    const unit = range[3];
    const nums = range[0]
      .replace(/\s*(TB|GB|GiB|MB)\b/i, "")
      .split("/")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    for (const n of nums) out.push(toGb(n, unit));
    return out;
  }
  const re = /(\d+(?:\.\d+)?)\s*(TB|GB|GiB|MB)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    out.push(toGb(n, m[2]));
  }
  return out;
}

/** Highest GB value in a wiki range like `8/12 GB LPDDR5`. */
export function topCapacityGb(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const nums = parseGbTokens(String(raw));
  if (!nums.length) return null;
  return Math.max(...nums);
}

/** Sorted unique GB options (`8/12 GB` → [8, 12]). */
export function parseCapacityOptionsGb(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const rounded = parseGbTokens(String(raw))
    .map((n) => Math.round(n))
    .filter((n) => Number.isFinite(n) && n > 0);
  return Array.from(new Set(rounded)).sort((a, b) => a - b);
}

export function formatGbShort(gb: number | null): string | null {
  if (gb == null || !Number.isFinite(gb)) return null;
  if (gb >= 1024) {
    const tb = gb / 1024;
    return Number.isInteger(tb) ? `${tb}TB` : `${tb.toFixed(1)}TB`;
  }
  return `${Math.round(gb)}GB`;
}

/** Display labels (`8GB`, `12GB`). */
export function formatCapacityStack(raw: string | null | undefined): string[] {
  return parseCapacityOptionsGb(raw)
    .map((gb) => formatGbShort(gb))
    .filter((s): s is string => Boolean(s));
}

/** True when selected GB is one of the device's listed options. */
export function capacityOptionMatches(raw: string | null | undefined, selectedGb: number): boolean {
  if (!Number.isFinite(selectedGb)) return true;
  return parseCapacityOptionsGb(raw).includes(Math.round(selectedGb));
}
