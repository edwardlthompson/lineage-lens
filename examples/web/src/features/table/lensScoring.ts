import type { VideoCapabilities } from "../../types/device";
import { enabledFrameRates } from "./cameraFormat";

function videoScoreFromCaps(video: VideoCapabilities | null | undefined): number {
  if (!video) return 0;
  let score = 0;
  const f1080 = enabledFrameRates(video["1080p"]);
  const f4k = enabledFrameRates(video["4k"]);
  const f8k = enabledFrameRates(video["8k"]);
  if (f1080.length) score += 15 + Math.min(25, Math.max(...f1080) / 8);
  if (f4k.length) {
    const max4k = Math.max(...f4k);
    score += 30 + Math.min(30, max4k / 4);
    if (max4k >= 120) score += 16;
  }
  if (f8k.length) score += 15 + Math.min(10, Math.max(...f8k) / 6);
  else if (video["4k"]?.["8K"]) score += 15;
  const flags = { ...(video["1080p"] ?? {}), ...(video["4k"] ?? {}), ...(video["8k"] ?? {}) };
  if (flags["10 Bit"] || flags.HDR || flags["HDR10+"] || flags.Dolby) score += 12;
  return Math.min(100, score);
}

/** OIS present → 100; no OIS (including EIS-only) → 0. */
export function oisStabScore(ois: boolean | null | undefined): number {
  return ois === true ? 100 : 0;
}

/** Attribute device-level video to lenses by role. */
export function lensVideoScore(
  type: string,
  deviceVideo: VideoCapabilities | null | undefined,
  videoText?: string | null,
): { score: number | null; note: string } {
  const base = videoScoreFromCaps(deviceVideo);
  const text = (videoText ?? "").toLowerCase();
  const hasDeviceVideo = base > 0 || Boolean(text.trim());
  if (!hasDeviceVideo) {
    return { score: null, note: "no video data" };
  }
  const mainScore = base > 0 ? base : text.includes("4k") ? 55 : text.includes("1080") ? 30 : 20;
  switch (type) {
    case "main":
    case "wide":
      return { score: mainScore, note: "full device video (main)" };
    case "ultrawide":
      return { score: Math.round(mainScore * 0.55), note: "est. uw" };
    case "telephoto":
      return { score: Math.round(mainScore * 0.5), note: "est. tele" };
    case "front":
      return { score: Math.round(mainScore * 0.4), note: "est. front" };
    case "macro":
    case "depth":
      return { score: Math.round(mainScore * 0.15), note: "est. aux" };
    default:
      return { score: Math.round(mainScore * 0.35), note: "est." };
  }
}

export function blurScore(blurIndex: number | null | undefined): number | null {
  if (blurIndex == null || blurIndex <= 0) return null;
  return Math.min(100, Math.max(0, (blurIndex / 15) * 100));
}

const OPTICS_WEIGHT_TOTAL = 0.3 + 0.15 + 0.1 + 0.3 + 0.15;

export function lensOpticsScore(parts: {
  diagMm: number | null;
  pitch: number | null;
  aperture: number | null;
  ffEq: number | null;
  blur: number | null;
  ois: boolean | null;
}): number | null {
  let score = 0;
  let present = 0;
  if (parts.diagMm != null) {
    score += Math.min(100, Math.max(0, ((parts.diagMm - 4) / 12) * 100)) * 0.3;
    present += 1;
  }
  if (parts.pitch != null) {
    score += Math.min(100, Math.max(0, ((parts.pitch - 0.5) / 1.3) * 100)) * 0.15;
    present += 1;
  }
  if (parts.aperture != null) {
    score += Math.min(100, Math.max(0, ((2.6 - parts.aperture) / 1.4) * 100)) * 0.1;
    present += 1;
  }
  const bScore = blurScore(parts.blur);
  if (bScore != null) {
    score += bScore * 0.3;
    present += 1;
  }
  const oisPoints = parts.ois === true ? 100 : 0;
  if (parts.ois === true || parts.ois === false || present > 0) {
    score += oisPoints * 0.15;
    present += 1;
  }
  if (present <= 0) return null;
  return score / OPTICS_WEIGHT_TOTAL;
}

/** Score a single lens' pixel pitch (larger µm → higher score). */
export function pixelPitchScore(pitchUm: number | null | undefined): number | null {
  if (pitchUm == null || pitchUm <= 0) return null;
  return Math.min(100, Math.max(0, ((pitchUm - 0.5) / 1.3) * 100));
}

export function lensWeight(type: string): number {
  if (type === "main" || type === "wide") return 1.4;
  if (type === "front") return 0.7;
  return 1.0;
}

export function bitrateScore(mbps: number | null | undefined): number | null {
  if (mbps == null || mbps <= 0) return null;
  // log10(32)≈1.5 → ~0; log10(8000)≈3.9 → 100
  const score = ((Math.log10(mbps) - 1.5) / (3.9 - 1.5)) * 100;
  return Math.min(100, Math.max(0, score));
}

/** Optics plus bitrate. Video resolution and frame rate are excluded (lost on LineageOS). */
export function combineLensScore(parts: {
  optics: number | null;
  bitrate: number | null;
  video?: number | null;
}): number | null {
  const o = parts.optics;
  const b = parts.bitrate;
  if (o == null && b == null) return null;
  if (o != null && b != null) return o * 0.25 + b * 0.75;
  return b ?? o;
}

export function formatFfEq(mm: number | null | undefined): string {
  if (mm == null || Number.isNaN(mm)) return "—";
  return `${mm.toFixed(0)} mm-eq`;
}

export function formatBlur(b: number | null | undefined): string {
  if (b == null || Number.isNaN(b)) return "—";
  return b.toFixed(1);
}
