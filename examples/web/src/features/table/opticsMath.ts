import type { CameraModule, Device, VideoCapabilities } from "../../types/device";
import { enabledFrameRates, meaningfulCameras } from "./cameraFormat";
import {
  diagFromSensorModel,
  estimateFrontDiagFromMp,
  formatFromSensorModel,
  pitchFromSensorModel,
} from "./sensorCatalog";

/** Full-frame 36×24 mm diagonal (mm). */
export const FF_DIAGONAL_MM = Math.hypot(36, 24); // ~43.267

export type LensOptics = {
  type: string;
  sensorDiagMm: number | null;
  opticalFormat: string | null;
  pixelPitchUm: number | null;
  /** True optical focal length if known (mm). */
  focalTrueMm: number | null;
  /** 35mm / full-frame equivalent focal length (mm). */
  focalFfEqMm: number | null;
  aperture: number | null;
  /** Relative background-blur index (higher = more blur); null if underdetermined. */
  blurIndex: number | null;
  sensorModel: string | null;
  ois: boolean | null;
  zoom: number | null;
  /** Per-lens camera score (optics + video for this lens). */
  lensScore: number | null;
  /** Video capability score attributed to this lens. */
  videoScore: number | null;
  videoNote: string;
};

/**
 * Phone optical formats use the TV "Type" inch system where 1" ≈ 16 mm diagonal
 * (not a literal 25.4 mm inch). So 1/1.31" ≈ 16/1.31 ≈ 12.2 mm.
 */
function opticalFormatToDiag(fmt: string | null | undefined): number | null {
  if (!fmt) return null;
  const s = fmt.trim();
  const TYPE1_MM = 16;
  const frac = s.match(/^1\s*\/\s*(\d+(?:\.\d+)?)/);
  if (frac) {
    const d = Number(frac[1]);
    return d > 0 ? TYPE1_MM / d : null;
  }
  const plain = s.match(/^(\d+(?:\.\d+)?)$/);
  if (plain) {
    const d = Number(plain[1]);
    // Sheet "Size" is usually the 1/x denominator when ≤ 4
    if (d > 0 && d <= 4) return TYPE1_MM / d;
    if (d > 4) return d;
  }
  return null;
}

export function sensorDiagonalMm(cam: CameraModule): number | null {
  if (cam.sensor_size_mm != null && cam.sensor_size_mm > 0) return cam.sensor_size_mm;
  const fromFmt = opticalFormatToDiag(cam.optical_format);
  if (fromFmt != null) return fromFmt;
  const fromModel = diagFromSensorModel(cam.sensor_model);
  if (fromModel != null) return fromModel;
  // Selfie cams often lack optical_format in wiki/CSV — estimate from MP
  if (cam.type === "front") return estimateFrontDiagFromMp(cam.mp ?? null);
  return null;
}

/** Pixel pitch: module value, else datasheet catalog from part number. */
export function sensorPixelPitchUm(cam: CameraModule): number | null {
  if (cam.pixel_pitch_um != null && cam.pixel_pitch_um > 0) return cam.pixel_pitch_um;
  return pitchFromSensorModel(cam.sensor_model);
}

/** Optical format string for display / crop math. */
export function sensorOpticalFormat(cam: CameraModule): string | null {
  if (cam.optical_format) return cam.optical_format;
  return formatFromSensorModel(cam.sensor_model);
}

export function cropFactor(diagMm: number | null): number | null {
  if (diagMm == null || diagMm <= 0) return null;
  return FF_DIAGONAL_MM / diagMm;
}

/**
 * Phone listings usually publish 35mm-equivalent FL (e.g. 24mm, 120mm).
 * True optical FL is typically &lt; 10 mm. Convert when needed.
 */
export function fullFrameEquivalentMm(
  cam: CameraModule,
  diagMm: number | null,
): { ffEq: number | null; trueFl: number | null } {
  const fl = cam.focal_length_mm;
  if (fl == null || fl <= 0) {
    // Estimate from FOV if present: FOV ≈ 2*atan(diag/(2f)) on sensor → f_true
    if (cam.fov_deg != null && diagMm != null && cam.fov_deg > 0 && cam.fov_deg < 180) {
      const rad = (cam.fov_deg * Math.PI) / 180;
      const trueFl = diagMm / (2 * Math.tan(rad / 2));
      const crop = cropFactor(diagMm);
      return { trueFl, ffEq: crop != null ? trueFl * crop : null };
    }
    return { ffEq: null, trueFl: null };
  }
  if (fl < 10) {
    const crop = cropFactor(diagMm);
    return { trueFl: fl, ffEq: crop != null ? fl * crop : null };
  }
  // Already FF-equivalent marketing figure
  const crop = cropFactor(diagMm);
  return { ffEq: fl, trueFl: crop != null ? fl / crop : null };
}

/**
 * Relative background blur index at typical portrait distance.
 * Scales with sensor size and entrance pupil; uses FF-eq for framing context.
 */
export function backgroundBlurIndex(
  diagMm: number | null,
  aperture: number | null,
  ffEqMm: number | null,
): number | null {
  if (diagMm == null || aperture == null || aperture <= 0) return null;
  const framing = ffEqMm != null && ffEqMm > 0 ? ffEqMm / 35 : 1;
  // Entrance-pupil proxy: diag / N, weighted by tele framing
  return (diagMm / aperture) * framing;
}

function videoScoreFromCaps(video: VideoCapabilities | null | undefined): number {
  if (!video) return 0;
  let score = 0;
  const f1080 = enabledFrameRates(video["1080p"]);
  const f4k = enabledFrameRates(video["4k"]);
  if (f1080.length) score += 15 + Math.min(25, Math.max(...f1080) / 8);
  if (f4k.length) score += 30 + Math.min(30, Math.max(...f4k) / 4);
  const flags = { ...(video["1080p"] ?? {}), ...(video["4k"] ?? {}) };
  if (flags["10 Bit"] || flags.HDR || flags["HDR10+"] || flags.Dolby) score += 12;
  if (flags["8K"]) score += 15;
  return Math.min(100, score);
}

/**
 * Attribute device-level video to lenses. Older phones often only do 4K on main.
 * Without per-lens video metadata we apply role-based fractions of the main score.
 */
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
      return {
        score: Math.round(mainScore * 0.55),
        note: "est. — often 1080p/limited 4K",
      };
    case "telephoto":
      return {
        score: Math.round(mainScore * 0.5),
        note: "est. — often limited vs main",
      };
    case "front":
      return {
        score: Math.round(mainScore * 0.4),
        note: "est. — selfie video usually lower",
      };
    case "macro":
    case "depth":
      return { score: Math.round(mainScore * 0.15), note: "est. — weak/aux video" };
    default:
      return { score: Math.round(mainScore * 0.35), note: "est." };
  }
}

/** Map raw blur index to 0–100 (typical phone range ~1–15). */
export function blurScore(blurIndex: number | null | undefined): number | null {
  if (blurIndex == null || blurIndex <= 0) return null;
  return Math.min(100, Math.max(0, (blurIndex / 15) * 100));
}

/** Full optics weight budget — missing terms score 0 (no renormalization). */
const OPTICS_WEIGHT_TOTAL = 0.3 + 0.15 + 0.1 + 0.3 + 0.15; // 1.0

function lensOpticsScore(parts: {
  diagMm: number | null;
  pitch: number | null;
  aperture: number | null;
  ffEq: number | null;
  blur: number | null;
  ois: boolean | null;
}): number | null {
  let score = 0;
  let present = 0;
  // Fixed denominator: incomplete lenses cannot outrank complete ones by
  // dropping unknown terms and rescaling the rest.
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
  if (parts.ois != null) {
    score += (parts.ois ? 100 : 25) * 0.15;
    present += 1;
  }
  if (present <= 0) return null;
  return score / OPTICS_WEIGHT_TOTAL;
}

export function analyzeLens(
  cam: CameraModule,
  device: Device,
): LensOptics {
  const diag = sensorDiagonalMm(cam);
  const { ffEq, trueFl } = fullFrameEquivalentMm(cam, diag);
  const blur = backgroundBlurIndex(diag, cam.aperture ?? null, ffEq);
  const video = lensVideoScore(
    cam.type,
    device.video,
    device.aggregates.video_caps_text,
  );
  const pitch = sensorPixelPitchUm(cam);
  const optFmt = sensorOpticalFormat(cam);
  const optics = lensOpticsScore({
    diagMm: diag,
    pitch,
    aperture: cam.aperture ?? null,
    ffEq,
    blur,
    ois: cam.ois ?? null,
  });
  let lensScore: number | null = null;
  if (optics != null || video.score != null) {
    // Missing optics/video contribute 0 — do not invent placeholder points.
    const o = optics ?? 0;
    const v = video.score ?? 0;
    lensScore = o * 0.65 + v * 0.35;
  }
  return {
    type: cam.type,
    sensorDiagMm: diag,
    opticalFormat: optFmt,
    pixelPitchUm: pitch,
    focalTrueMm: trueFl,
    focalFfEqMm: ffEq,
    aperture: cam.aperture ?? null,
    blurIndex: blur,
    sensorModel: cam.sensor_model ?? null,
    ois: cam.ois ?? null,
    zoom: cam.zoom ?? null,
    lensScore,
    videoScore: video.score,
    videoNote: video.note,
  };
}

/** Score a single lens' pixel pitch (larger µm → higher score). */
export function pixelPitchScore(pitchUm: number | null | undefined): number | null {
  if (pitchUm == null || pitchUm <= 0) return null;
  // 0.5 µm → ~0, 1.8 µm → ~100
  return Math.min(100, Math.max(0, ((pitchUm - 0.5) / 1.3) * 100));
}

function lensWeight(type: string): number {
  if (type === "main" || type === "wide") return 1.4;
  if (type === "front") return 0.7;
  return 1.0;
}

export function analyzeDeviceLenses(device: Device): {
  lenses: LensOptics[];
  totalSensorDiagMm: number;
  totalSensorAreaMm2: number;
  overallScore: number | null;
  /** Weighted overall pixel-pitch score (0–100). */
  overallPixelPitchScore: number | null;
  /** Weighted overall blur score (0–100). */
  overallBlurScore: number | null;
} {
  const cams = meaningfulCameras(device.cameras);
  const lenses = cams.map((c) => analyzeLens(c, device));
  let totalDiag = 0;
  let totalArea = 0;
  for (const L of lenses) {
    if (L.sensorDiagMm != null) {
      totalDiag += L.sensorDiagMm;
      // approx area from 4:3 diagonal
      const w = L.sensorDiagMm * 0.8;
      const h = L.sensorDiagMm * 0.6;
      totalArea += w * h;
    }
  }
  let overall: number | null = null;
  let num = 0;
  let den = 0;
  let hasMain = false;
  for (const L of lenses) {
    const w = lensWeight(L.type);
    // Unscored lenses still occupy weight (score 0) so thin/partial stacks
    // cannot beat fully specified devices by omitting gaps from the average.
    num += (L.lensScore ?? 0) * w;
    den += w;
    if ((L.type === "main" || L.type === "wide") && L.lensScore != null) {
      hasMain = true;
    }
  }
  // Overall requires a scored main/wide — selfie-only fragments do not rank.
  if (den > 0 && hasMain) overall = num / den;

  let ppOverall: number | null = null;
  let ppNum = 0;
  let ppDen = 0;
  for (const L of lenses) {
    const s = pixelPitchScore(L.pixelPitchUm);
    if (s == null) continue;
    const w = lensWeight(L.type);
    ppNum += s * w;
    ppDen += w;
  }
  if (ppDen > 0) ppOverall = ppNum / ppDen;

  let blurOverall: number | null = null;
  let blurNum = 0;
  let blurDen = 0;
  for (const L of lenses) {
    const s = blurScore(L.blurIndex);
    if (s == null) continue;
    const w = lensWeight(L.type);
    blurNum += s * w;
    blurDen += w;
  }
  if (blurDen > 0) blurOverall = blurNum / blurDen;

  return {
    lenses,
    totalSensorDiagMm: totalDiag,
    totalSensorAreaMm2: totalArea,
    overallScore: overall,
    overallPixelPitchScore: ppOverall,
    overallBlurScore: blurOverall,
  };
}

export function formatFfEq(mm: number | null | undefined): string {
  if (mm == null || Number.isNaN(mm)) return "—";
  return `${mm.toFixed(0)} mm-eq`;
}

export function formatBlur(b: number | null | undefined): string {
  if (b == null || Number.isNaN(b)) return "—";
  return b.toFixed(1);
}
