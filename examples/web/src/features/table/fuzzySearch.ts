/**
 * Lightweight fuzzy match for device table global search (no extra deps).
 */

/** True when query is empty, a substring, or chars appear in order. */
export function fuzzyMatch(haystack: string, query: string): boolean {
  const h = haystack.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (h.includes(q)) return true;
  let hi = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    if (ch === " ") continue;
    const found = h.indexOf(ch, hi);
    if (found < 0) return false;
    hi = found + 1;
  }
  return true;
}

/** Search blob for a device row. */
export function deviceSearchBlob(device: {
  vendor?: string;
  name?: string;
  codename?: string;
  models?: string[];
  soc?: string | null;
  lineage_label?: string | null;
}): string {
  return [
    device.vendor,
    device.name,
    device.codename,
    ...(device.models ?? []),
    device.soc ?? "",
    device.lineage_label ?? "",
  ]
    .join(" ")
    .toLowerCase();
}
