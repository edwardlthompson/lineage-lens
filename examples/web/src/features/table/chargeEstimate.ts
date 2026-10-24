/**
 * Research-backed charge speed estimates when wiki/GSMArena omit wattage.
 * Capacity ↑ → wired W ↑; Qi2 > Qi1 for wireless W + score. Calibrated to
 * common 2021–2026 Android flagships (Pixel ~27W wired / Qi1; Xiaomi 67–120W).
 */
export type QiProtocol = "Qi1" | "Qi2";

/** Infer Qi1 vs Qi2 from peripherals text + release year. */
export function inferQiProtocol(
  blob: string,
  year: number | null | undefined,
  vendor: string | null | undefined,
): QiProtocol | null {
  const t = blob.toLowerCase();
  const hasQi2 = /\bqi\s*2(?:\.0)?\b|\bqi2\b/.test(t);
  const hasQi = hasQi2 || /\bqi\b/.test(t) || /wireless\s*charg/.test(t);
  if (!hasQi) return null;
  if (hasQi2) return "Qi2";
  // Pixel 9-class stays Qi1; magnetic Qi2 is common on 2025+ non-Google OEMs.
  const v = (vendor ?? "").toLowerCase();
  if (v.includes("google")) return "Qi1";
  if (year != null && year >= 2025) return "Qi2";
  return "Qi1";
}

/** Wired watts from capacity (+ year/vendor dampening). */
export function estimateWiredWatts(
  mah: number | null,
  year: number | null | undefined,
  vendor: string | null | undefined,
): number | null {
  if (mah == null || mah <= 0) return null;
  let w: number;
  if (mah >= 7000) w = 120;
  else if (mah >= 6000) w = 100;
  else if (mah >= 5500) w = 80;
  else if (mah >= 5000) w = 65;
  else if (mah >= 4500) w = 45;
  else if (mah >= 4000) w = 33;
  else if (mah >= 3500) w = 25;
  else w = 18;

  if (year != null && year <= 2019) w = Math.min(w, 18);
  else if (year != null && year <= 2021) w = Math.min(w, 33);

  const v = (vendor ?? "").toLowerCase();
  if (v.includes("google")) w = Math.min(w, year != null && year >= 2024 ? 30 : 23);
  else if (v.includes("sony")) w = Math.min(w, Math.round(w * 0.7));
  else if (v.includes("samsung")) w = Math.min(w, Math.round(w * 0.85));
  else if (/xiaomi|redmi|poco|realme/.test(v)) w = Math.min(120, Math.round(w * 1.35));
  else if (v.includes("oneplus")) w = Math.min(100, Math.round(w * 1.25));
  return w;
}

/** Wireless watts from Qi protocol + capacity. */
export function estimateWirelessWatts(qi: QiProtocol | null, mah: number | null): number | null {
  if (!qi) return null;
  if (qi === "Qi2") return mah != null && mah >= 5000 ? 25 : 15;
  if (mah != null && mah >= 4800) return 15;
  if (mah != null && mah >= 4000) return 10;
  return 8;
}
