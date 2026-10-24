/**
 * Stabilization / flash / Log-HLG classifiers from device fields (Phase 2).
 */
import type { CameraFeatures, CameraModule, Device } from "../../types/device";
import { meaningfulCameras } from "./cameraFormat";

export type StabClass = "ois" | "eis" | "hybrid" | "unknown";

export type FlashClass = "dual_tone" | "dual" | "single" | "none" | "unknown";

export function stabilizationClass(device: Device): StabClass {
  const cams = meaningfulCameras(device.cameras);
  const hasOis = cams.some((c) => c.ois === true) || device.aggregates.has_ois_main === true;
  const hasEis = device.camera_features?.eis === true;
  if (hasOis && hasEis) return "hybrid";
  if (hasOis) return "ois";
  if (hasEis) return "eis";
  return "unknown";
}

/** Per-camera stab label for the optics Stab column. */
export type LensStabLabel = "EIS" | "OIS" | "Both" | "None";

export function lensStabLabel(ois: boolean | null | undefined, deviceEis: boolean): LensStabLabel {
  const hasOis = ois === true;
  if (hasOis && deviceEis) return "Both";
  if (hasOis) return "OIS";
  if (deviceEis) return "EIS";
  return "None";
}

export function flashClass(flash: string | null | undefined): FlashClass {
  if (!flash) return "unknown";
  const s = flash.trim().toLowerCase();
  if (!s || s === "none") return "none";
  if (/dual[\s-]?tone|dual[\s-]?led|2[\s-]?tone/.test(s)) return "dual_tone";
  if (/dual/.test(s)) return "dual";
  if (/led|flash|single/.test(s)) return "single";
  return "unknown";
}

export function mainFlashClass(device: Device): FlashClass {
  const main =
    meaningfulCameras(device.cameras).find((c) => c.type === "main" || c.type === "wide") ??
    meaningfulCameras(device.cameras)[0];
  return flashClass(main?.flash);
}

/** Prefer structured camera_features; fall back to video / notes text. */
export function hasLogVideo(features: CameraFeatures | null | undefined, blob?: string): boolean {
  if (features?.log_video === true) return true;
  const t = `${features?.notes ?? ""} ${blob ?? ""}`.toLowerCase();
  return /\blog\b|cinelog/.test(t);
}

export function hasHlgVideo(features: CameraFeatures | null | undefined, blob?: string): boolean {
  if (features?.hlg === true) return true;
  const t = `${features?.notes ?? ""} ${blob ?? ""}`.toLowerCase();
  return /\bhlg\b|hybrid.?log.?gamma/.test(t);
}

export function hasPhoto10Bit(features: CameraFeatures | null | undefined, blob?: string): boolean {
  if (features?.photo_10bit === true) return true;
  const t = `${features?.notes ?? ""} ${blob ?? ""}`.toLowerCase();
  return /10[\s-]?bit/.test(t) && /photo|still|heif|raw/.test(t);
}

export function continuousZoomHint(cams: CameraModule[], notes?: string | null): boolean {
  const blob = `${notes ?? ""} ${cams.map((c) => c.info ?? "").join(" ")}`.toLowerCase();
  return /continuous zoom|seamless zoom|multi-?cam.*record|zoom while record/.test(blob);
}
