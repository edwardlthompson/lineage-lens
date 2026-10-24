/**
 * Used-market, audio, Lineage camera maturity (Phase 4).
 * Charge helpers live in chargeSignals.ts (re-exported here).
 */
import type { Device } from "../../types/device";

export {
  type ChargeHint,
  chargeUxScore,
  formatCharge,
  formatChargeLines,
  parseChargeHints,
  wattsUxScore,
} from "./chargeSignals";

/** Coarse used-market proxy: newer + common model → higher. 0–100. */
export function usedMarketProxy(device: Device): number | null {
  const year = device.release_year;
  if (year == null || !Number.isFinite(year)) return null;
  const age = Math.max(0, 2026 - year);
  const ageScore = Math.max(0, 100 - age * 12);
  const models = device.models?.length ?? 0;
  const modelBoost = Math.min(15, models * 3);
  return Math.round(Math.min(100, ageScore + modelBoost));
}

export type AudioHint = "stereo" | "wind" | "external" | "unknown";

export function audioHints(device: Device): AudioHint[] {
  const blob = [...(device.peripherals ?? []), device.bluetooth ?? ""].join(" ").toLowerCase();
  const out: AudioHint[] = [];
  if (/stereo\s*speakers|dual\s*speakers/.test(blob)) out.push("stereo");
  if (/wind\s*noise|wind\s*reduction/.test(blob)) out.push("wind");
  if (/3\.5\s*mm|usb.?c\s*audio|external\s*mic/.test(blob)) out.push("external");
  return out.length ? out : ["unknown"];
}

/** Lineage camera maturity: longevity × data quality × maintainers (0–100). */
export function cameraMaturityScore(device: Device): number | null {
  const longevity = device.scores?.longevity_score;
  const base = longevity != null && Number.isFinite(longevity) ? longevity : null;
  const q = device.provenance.quality;
  const qMul = q === "complete" ? 1 : q === "enriched" ? 0.85 : q === "partial" ? 0.65 : 0.45;
  const maint = Math.min(1.15, 0.85 + (device.maintainers?.length ?? 0) * 0.05);
  if (base == null) {
    if (q === "wiki_only") return Math.round(25 * maint);
    return null;
  }
  return Math.round(Math.min(100, base * qMul * maint));
}
