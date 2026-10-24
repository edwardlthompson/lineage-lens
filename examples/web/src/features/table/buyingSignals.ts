/**
 * Derive-only buying signals from existing device / lens data (Phase 1).
 */
import type { Device } from "../../types/device";
import { enabledFrameRates, meaningfulCameras } from "./cameraFormat";
import { analyzeDeviceLenses, pixelPitchScore } from "./opticsMath";

/** Main lens optics rank 0–100 (diag + pitch + OIS). */
export function mainSensorRank(device: Device): number | null {
  const { lenses } = analyzeDeviceLenses(device);
  const main = lenses.find((l) => l.type === "main" || l.type === "wide") ?? lenses[0];
  if (!main) return null;
  const parts: number[] = [];
  if (main.sensorDiagMm != null && main.sensorDiagMm > 0) {
    parts.push(Math.min(100, (main.sensorDiagMm / 16) * 100));
  }
  const pp = pixelPitchScore(main.pixelPitchUm);
  if (pp != null) parts.push(pp);
  if (main.ois === true) parts.push(100);
  else if (main.ois === false) parts.push(30);
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/** Max optical zoom factor (×). */
export function zoomReachX(device: Device): number | null {
  const agg = device.aggregates.max_optical_zoom;
  if (agg != null && agg > 1) return agg;
  let max = 0;
  for (const c of meaningfulCameras(device.cameras)) {
    if (c.zoom != null && c.zoom > max) max = c.zoom;
  }
  return max > 1 ? max : null;
}

/** Ultrawide FOV degrees when known. */
export function uwFovDeg(device: Device): number | null {
  for (const c of meaningfulCameras(device.cameras)) {
    if (c.type === "ultrawide" && c.fov_deg != null && c.fov_deg > 0) return c.fov_deg;
  }
  return null;
}

/** Highest enabled 1080p fps (slow-mo ceiling proxy). */
export function slowMoCeilingFps(device: Device): number | null {
  const rates = enabledFrameRates(device.video?.["1080p"]);
  if (!rates.length) return null;
  return Math.max(...rates);
}

export type ProVideoFlags = {
  hdr10: boolean;
  dolby: boolean;
  tenBit: boolean;
  k4_60: boolean;
  k4_120: boolean;
};

export function proVideoFlags(device: Device): ProVideoFlags {
  const f4k = device.video?.["4k"] ?? {};
  const rates = enabledFrameRates(f4k);
  const max4 = rates.length ? Math.max(...rates) : 0;
  return {
    hdr10: Boolean(f4k["HDR10+"] || f4k.HDR || device.camera_features?.hdr10),
    dolby: Boolean(f4k.Dolby || device.camera_features?.dolby_vision),
    tenBit: Boolean(f4k["10 Bit"]),
    k4_60: max4 >= 60,
    k4_120: max4 >= 120,
  };
}

export function formatProVideoBadges(flags: ProVideoFlags): string[] {
  const out: string[] = [];
  if (flags.k4_120) out.push("4K120");
  else if (flags.k4_60) out.push("4K60");
  if (flags.tenBit) out.push("10-bit");
  if (flags.dolby) out.push("DV");
  else if (flags.hdr10) out.push("HDR10");
  return out;
}

export type CameraGap = "no_main_ois" | "no_ultrawide" | "no_tele" | "no_video" | "wiki_only";

/** Known camera gaps for buyer caution badges. */
export function cameraGaps(device: Device): CameraGap[] {
  const gaps: CameraGap[] = [];
  const cams = meaningfulCameras(device.cameras);
  const main = cams.find((c) => c.type === "main" || c.type === "wide");
  if (main && main.ois !== true) gaps.push("no_main_ois");
  if (!cams.some((c) => c.type === "ultrawide") && !device.aggregates.has_ultrawide) {
    gaps.push("no_ultrawide");
  }
  if (!cams.some((c) => c.type === "telephoto") && !device.aggregates.has_telephoto) {
    gaps.push("no_tele");
  }
  const v = device.video;
  const hasVid =
    enabledFrameRates(v?.["1080p"]).length > 0 ||
    enabledFrameRates(v?.["4k"]).length > 0 ||
    enabledFrameRates(v?.["8k"]).length > 0;
  if (!hasVid) gaps.push("no_video");
  if (device.provenance.quality === "wiki_only") gaps.push("wiki_only");
  return gaps;
}

export function formatCameraGaps(gaps: CameraGap[]): string {
  if (!gaps.length) return "";
  const labels: Record<CameraGap, string> = {
    no_main_ois: "no OIS",
    no_ultrawide: "no UW",
    no_tele: "no tele",
    no_video: "no video",
    wiki_only: "wiki-only",
  };
  return gaps.map((g) => labels[g]).join(", ");
}

export function worthBuyingScore(device: Device): number | null {
  const s = device.scores?.worth_buying_score;
  if (s == null || !Number.isFinite(s)) return null;
  return s;
}
