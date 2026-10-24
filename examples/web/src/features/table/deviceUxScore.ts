/**
 * Glanceable SoC + RAM + charge UX (0–100). Soft-caps extras; soft-ceilings the top.
 */
import type { Device } from "../../types/device";
import { topCapacityGb } from "./capacityOptions";
import { chargeUxScore, parseChargeHints } from "./chargeSignals";
import { ipUxDelta } from "./ipRating";
import { socPerformanceTier } from "./performanceTieBreak";
import {
  flattenScreen,
  isTvOrBoxType,
  panelTechClass,
  resolutionUxDelta,
  type ScreenLike,
  screenPpi,
  screenTech,
} from "./screenGeometry";

type UxDevice = {
  type?: string | null;
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
  screen?: ScreenLike;
  battery?: Device["battery"];
  peripherals?: Device["peripherals"];
  waterproofing?: string | null;
  codename?: string | null;
};

/** Highest UFS generation named in a storage string, if any. */
export function bestUfs(storage: string | null | undefined): number | null {
  const matches = [...(storage ?? "").toLowerCase().matchAll(/ufs\s*([0-9](?:\.[0-9])?)/g)];
  if (!matches.length) return null;
  return Math.max(...matches.map((m) => Number(m[1])));
}

/** Faster storage raises UX. Missing or eMMC leaves the score unchanged. */
export function storageUxDelta(storage: string | null | undefined): number {
  const ufs = bestUfs(storage);
  if (ufs == null) return 0;
  if (ufs >= 4) return 5;
  if (ufs >= 3.1) return 3;
  if (ufs >= 3) return 1;
  return 0;
}

/** Higher refresh raises UX. 60 Hz and unknown screens add nothing. */
export function refreshUxDelta(screen: ScreenLike): number {
  const flat = flattenScreen(screen);
  const raw = flat.refresh_rate;
  const hz = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(hz)) return 0;
  if (hz >= 144) return 5;
  if (hz >= 120) return 3;
  if (hz >= 90) return 1;
  return 0;
}

/** Higher pixel density raises UX. Missing PPI adds nothing. */
export function ppiUxDelta(screen: ScreenLike): number {
  const ppi = screenPpi(screen);
  if (ppi == null) return 0;
  if (ppi >= 500) return 5;
  if (ppi >= 400) return 3;
  if (ppi >= 300) return 1;
  return 0;
}

/** OLED family adds points; LCD is neutral; unknown adds nothing. */
export function panelTechUxDelta(screen: ScreenLike): number {
  return panelTechClass(screenTech(screen)) === "oled" ? 3 : 0;
}

export { resolutionUxDelta };

/** Faster RAM generations raise UX. Unknown type adds nothing. */
export function ramSpeedDelta(ram: string | null | undefined): number {
  const s = (ram ?? "").toLowerCase().replace(/\s+/g, "");
  if (!s) return 0;
  if (s.includes("lpddr5x")) return 5;
  if (s.includes("lpddr5")) return 3;
  if (s.includes("lpddr4x")) return 1;
  return 0;
}

/** Map top RAM GB → 0–100 responsiveness contribution. */
export function ramUxScore(ramGb: number | null): number | null {
  if (ramGb == null || !Number.isFinite(ramGb) || ramGb <= 0) return null;
  if (ramGb >= 18) return 100;
  if (ramGb >= 16) return 90;
  if (ramGb >= 12) return 75;
  if (ramGb >= 8) return 55;
  if (ramGb >= 6) return 40;
  if (ramGb >= 4) return 25;
  return 10;
}

/** Diminishing positive extras; IP penalties stay linear. */
export function softExtras(extras: number): number {
  if (extras <= 0) return extras;
  return 12 * (1 - Math.exp(-extras / 16));
}

/** Above 88, compress toward 100 so flagships spread instead of clamping. */
export function softCeilingUx(raw: number): number {
  if (raw <= 88) return Math.max(0, raw);
  return 88 + 12 * (1 - Math.exp(-(raw - 88) / 20));
}

/** SoC + RAM + charge + soft extras. Null when all three inputs are missing. */
export function deviceUxScore(device: UxDevice): number | null {
  const tier = socPerformanceTier(device.soc);
  const ram = ramUxScore(topCapacityGb(device.ram));
  const hasSoc = Boolean(device.soc?.trim()) && tier > 0;
  const charge =
    device.battery != null || (device.peripherals?.length ?? 0) > 0
      ? chargeUxScore(parseChargeHints(device as Device))
      : null;
  if (!hasSoc && ram == null && charge == null) return null;
  const socPart = hasSoc ? tier : 20;
  const ramPart = ram ?? 25;
  const base =
    charge != null ? socPart * 0.6 + ramPart * 0.2 + charge * 0.2 : socPart * 0.75 + ramPart * 0.25;
  const extras =
    (ipUxDelta(device.waterproofing) ?? 0) +
    storageUxDelta(device.storage) +
    refreshUxDelta(device.screen) +
    ppiUxDelta(device.screen) +
    panelTechUxDelta(device.screen) +
    (isTvOrBoxType(device.type) ? resolutionUxDelta(device.screen) : 0) +
    ramSpeedDelta(device.ram);
  return Math.round(Math.min(100, Math.max(0, softCeilingUx(base + softExtras(extras)))));
}

/** Equal weight: half UX, half camera. */
export function totalRankScore(ux: number | null, media: number | null): number | null {
  if (ux == null || media == null || ux < 0 || media < 0) return null;
  return Math.round(ux * 0.5 + media * 0.5);
}
