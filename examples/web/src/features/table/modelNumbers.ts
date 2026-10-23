/**
 * Rank retail model / part numbers for NA eBay search.
 * Higher = more likely US/Canada unlocked or carrier SKU.
 */

const NA_FLOOR = 70;

/** Score a single model string for North-America usefulness (0–100). */
export function naModelScore(model: string): number {
  const m = model.trim().toUpperCase().replace(/\s+/g, "");
  if (!m) return 0;

  // Samsung US unlocked / carrier / Canada
  if (/^SM-[A-Z0-9]+U1(?:\/[A-Z0-9]+)?$/.test(m)) return 100;
  if (/^SM-[A-Z0-9]+U(?:\/[A-Z0-9]+)?$/.test(m)) return 95;
  if (/^SM-[A-Z0-9]+W(?:\/[A-Z0-9]+)?$/.test(m)) return 88;

  // Sony Xperia: xx62 is typically Americas / US
  if (/^XQ-[A-Z]{2}62/.test(m)) return 92;

  // LG US carrier suffixes
  if (/(?:VM|TM|UM|US998)$/.test(m)) return 90;
  if (/^LM-[A-Z0-9]+U/.test(m)) return 85;

  // Motorola: -1 retail US common; V = Verizon
  if (/^XT\d+V$/.test(m)) return 90;
  if (/^XT\d+-1$/.test(m)) return 82;

  // OnePlus US / T-Mobile SKUs (LE21x5 / LE21x7; CPH…83 / …55)
  if (/^LE21(?:15|25|17|27)/.test(m)) return 93;
  if (/^CPH\d*(?:83|55)$/.test(m)) return 90;

  // Explicit NA / US tokens
  if (/\b(?:US|USA|NA)\b/.test(m) || m.includes("/US") || m.endsWith("-UN")) return 80;

  // Global / international (fallback when no NA SKU exists)
  if (/^SM-[A-Z0-9]+B(?:\/DS)?$/.test(m)) return 45;
  if (/^XQ-[A-Z]{2}54/.test(m)) return 44; // EU/global-ish
  if (/^\d{6,}G$/.test(m)) return 42; // Xiaomi global …G
  if (/^CPH\d+$/.test(m)) return 40;
  if (/^XT\d+-\d+$/.test(m)) return 38;

  // Deprioritize China / regional
  if (/^SM-[A-Z0-9]+0(?:\/[A-Z0-9]+)?$/.test(m)) return 12;
  if (/^\d{6,}C$/.test(m) || /^\d{6,}SC$/.test(m)) return 10;
  if (/^PJ[A-Z0-9]+$/.test(m)) return 10; // OnePlus CN
  if (/EEA|\/IN\b|-IN$/.test(m)) return 25;
  if (/^XQ-[A-Z]{2}72/.test(m)) return 22; // Asia

  return 30;
}

export function isNaModel(model: string): boolean {
  return naModelScore(model) >= NA_FLOOR;
}

/**
 * Sort models NA-first for eBay search. If no NA SKU exists, global/intl
 * part numbers still rise above China-only codes.
 */
export function sortModelsForNaEbay(models: string[] | null | undefined): string[] {
  const unique = [...new Set((models ?? []).map((m) => m.trim()).filter(Boolean))];
  return unique.sort((a, b) => {
    const d = naModelScore(b) - naModelScore(a);
    return d !== 0 ? d : a.localeCompare(b);
  });
}

/** Primary search token: best NA model, else best global, else first sorted. */
export function primaryEbayModel(models: string[] | null | undefined): string | null {
  const sorted = sortModelsForNaEbay(models);
  return sorted[0] ?? null;
}
