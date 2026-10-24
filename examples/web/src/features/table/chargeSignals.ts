/**
 * Battery / charge parse + UX scoring.
 */
import type { Device } from "../../types/device";
import { lookupCharge } from "./chargeCatalog";
import type { QiProtocol } from "./chargeEstimate";

export type ChargeHint = {
  capacityMah: number | null;
  wiredWatts: number | null;
  wirelessWatts: number | null;
  qiVersion: QiProtocol | null;
  wireless: boolean;
  /** Maker spec confirms there is no wireless charging. */
  wirelessAbsent: boolean;
};

function parseMah(bat: Record<string, unknown> | null | undefined): number | null {
  if (!bat) return null;
  const cap = bat.capacity ?? bat.Capacity ?? bat.size;
  const n = typeof cap === "number" ? cap : Number(String(cap ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 500 ? Math.round(n) : null;
}

/** Map charging watts → 0–100. */
export function wattsUxScore(watts: number | null | undefined): number | null {
  if (watts == null || !Number.isFinite(watts) || watts <= 0) return null;
  if (watts >= 100) return 100;
  if (watts >= 80) return 95;
  if (watts >= 65) return 85;
  if (watts >= 45) return 70;
  if (watts >= 33) return 55;
  if (watts >= 25) return 45;
  if (watts >= 18) return 35;
  return 20;
}

export function parseChargeHints(device: Device): ChargeHint {
  const bat = device.battery as Record<string, unknown> | null | undefined;
  const capacityMah = parseMah(bat);
  const blob = [...(device.peripherals ?? []), bat ? JSON.stringify(bat) : ""]
    .join(" ")
    .toLowerCase();

  const wlWatt =
    blob.match(/(\d{2,3})\s*w(?:att)?s?\s*(?:wireless|qi)/)?.[1] ??
    blob.match(/(?:wireless|qi)[^\d]{0,24}(\d{2,3})\s*w/)?.[1];
  let wirelessWatts = wlWatt != null ? Number(wlWatt) : null;

  const wiredWatt =
    blob.match(/(\d{2,3})\s*w(?:att)?s?\s*(?:wired|charging|fast|super|pd|charger)/)?.[1] ??
    blob.match(/(?:wired|fast|pd|super)\s*(?:charg\w*)?[^\d]{0,12}(\d{2,3})\s*w/)?.[1] ??
    (wirelessWatts == null ? blob.match(/(\d{2,3})\s*w(?:att)?s?\b/)?.[1] : undefined);
  let wiredWatts = wiredWatt != null ? Number(wiredWatt) : null;
  if (wiredWatts != null && wirelessWatts != null && wiredWatts === wirelessWatts) {
    const onlyWireless = /wireless|qi/.test(blob) && !/wired|fast\s*charg|pd\s*charg/.test(blob);
    if (onlyWireless) wiredWatts = null;
  }

  const catalog = lookupCharge(device.codename);
  if (catalog) {
    if (wiredWatts == null && catalog.wired != null) wiredWatts = catalog.wired;
    if (wirelessWatts == null && catalog.wireless != null) wirelessWatts = catalog.wireless;
  }

  const explicitQi2 = /\bqi\s*2(?:\.0)?\b|\bqi2\b/.test(blob);
  const explicitQi = explicitQi2 || /\bqi\b/.test(blob);
  const qiVersion: QiProtocol | null =
    catalog?.qi ?? (explicitQi2 ? "Qi2" : explicitQi ? "Qi1" : null);
  const wireless = catalog?.hasWireless === true || qiVersion != null || wirelessWatts != null;
  const wirelessAbsent = catalog?.hasWireless === false && !wireless;

  return {
    capacityMah,
    wiredWatts: wiredWatts != null && Number.isFinite(wiredWatts) ? wiredWatts : null,
    wirelessWatts: wirelessWatts != null && Number.isFinite(wirelessWatts) ? wirelessWatts : null,
    qiVersion: wireless ? qiVersion : null,
    wireless,
    wirelessAbsent,
  };
}

/**
 * Capacity + wired + Qi protocol + wireless W → 0–100.
 * Qi2 scores above Qi1; larger packs / faster watts score higher.
 */
export function chargeUxScore(hint: ChargeHint): number | null {
  const wired = wattsUxScore(hint.wiredWatts);
  const wlW = wattsUxScore(hint.wirelessWatts);
  const qiPart =
    hint.qiVersion === "Qi2" ? 100 : hint.qiVersion === "Qi1" ? 55 : hint.wireless ? 40 : null;
  let capPart: number | null = null;
  if (hint.capacityMah != null) {
    capPart = Math.min(100, Math.max(0, ((hint.capacityMah - 2500) / 4000) * 100));
  }
  const parts: { v: number; w: number }[] = [];
  if (capPart != null) parts.push({ v: capPart, w: 0.25 });
  if (wired != null) parts.push({ v: wired, w: 0.35 });
  if (qiPart != null) parts.push({ v: qiPart, w: 0.25 });
  if (wlW != null) parts.push({ v: wlW, w: 0.3 });
  if (!parts.length) return null;
  const wSum = parts.reduce((s, p) => s + p.w, 0);
  let score = Math.round(parts.reduce((s, p) => s + p.v * p.w, 0) / wSum);
  if (hint.wirelessAbsent) score = Math.max(0, score - 28);
  return score;
}

function wattLine(watts: number, suffix: string): string {
  const n = Number.isInteger(watts) ? String(watts) : String(watts);
  return `${n}W${suffix}`;
}

/** mAh, wired W, Qi/wireless. Missing published rates are "--". */
export function formatChargeLines(hint: ChargeHint): string[] {
  const lines: string[] = [];
  lines.push(hint.capacityMah != null ? `${hint.capacityMah} mAh` : "--");
  lines.push(hint.wiredWatts != null ? wattLine(hint.wiredWatts, " wired") : "--");
  if (hint.wirelessAbsent) {
    lines.push("--");
  } else if (hint.qiVersion && hint.wirelessWatts != null) {
    lines.push(`${hint.qiVersion} · ${wattLine(hint.wirelessWatts, "")}`);
  } else if (hint.qiVersion) {
    lines.push(hint.qiVersion);
  } else if (hint.wirelessWatts != null) {
    lines.push(wattLine(hint.wirelessWatts, ""));
  } else if (hint.wireless) {
    lines.push("--");
  } else {
    lines.push("--");
  }
  return lines;
}

export function formatCharge(hint: ChargeHint): string {
  const lines = formatChargeLines(hint);
  return lines.length ? lines.join(" · ") : "—";
}
