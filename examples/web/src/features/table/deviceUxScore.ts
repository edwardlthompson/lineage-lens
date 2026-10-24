/**
 * Glanceable SoC + RAM + charge responsiveness proxy (0–100).
 */
import type { Device } from "../../types/device";
import { topCapacityGb } from "./capacityOptions";
import { chargeUxScore, parseChargeHints } from "./chargeSignals";
import { ipUxDelta } from "./ipRating";
import { socPerformanceTier } from "./performanceTieBreak";

type UxDevice = {
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
  screen?: { refresh_rate?: number | null } | null;
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
  if (ufs >= 4) return 8;
  if (ufs >= 3.1) return 4;
  if (ufs >= 3) return 2;
  return 0;
}

/** Higher refresh raises UX. 60 Hz and unknown screens add nothing. */
export function refreshUxDelta(
  screen: { refresh_rate?: number | null } | null | undefined,
): number {
  const hz = screen?.refresh_rate;
  if (hz == null || !Number.isFinite(hz)) return 0;
  if (hz >= 144) return 8;
  if (hz >= 120) return 5;
  if (hz >= 90) return 2;
  return 0;
}

/** Faster RAM generations raise UX. Unknown type adds nothing. */
export function ramSpeedDelta(ram: string | null | undefined): number {
  const s = (ram ?? "").toLowerCase().replace(/\s+/g, "");
  if (!s) return 0;
  if (s.includes("lpddr5x")) return 8;
  if (s.includes("lpddr5")) return 5;
  if (s.includes("lpddr4x")) return 2;
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

/**
 * SoC + RAM + charge, then IP68 as the waterproofing baseline.
 * Null when SoC, RAM, and charge are all missing.
 */
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
  const ip = ipUxDelta(device.waterproofing);
  const extras =
    (ip ?? 0) +
    storageUxDelta(device.storage) +
    refreshUxDelta(device.screen) +
    ramSpeedDelta(device.ram);
  const scored = base + extras;
  return Math.round(Math.min(100, Math.max(0, scored)));
}

/** Equal weight: half UX, half camera. */
export function totalRankScore(ux: number | null, media: number | null): number | null {
  if (ux == null || media == null || ux < 0 || media < 0) return null;
  return Math.round(ux * 0.5 + media * 0.5);
}
