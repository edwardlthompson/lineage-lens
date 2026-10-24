import type { CameraModule } from "../../types/device";
import {
  diagFromSensorModel,
  estimateFrontDiagFromMp,
  formatFromSensorModel,
  pitchFromSensorModel,
} from "./sensorCatalog";

/** Full-frame 36×24 mm diagonal (mm). */
export const FF_DIAGONAL_MM = Math.hypot(36, 24);

/**
 * Phone optical formats use the TV "Type" inch system where 1" ≈ 16 mm diagonal
 * (not a literal 25.4 mm inch). So 1/1.31" ≈ 16/1.31 ≈ 12.2 mm.
 */
export function opticalFormatToDiag(fmt: string | null | undefined): number | null {
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
  if (cam.type === "front") return estimateFrontDiagFromMp(cam.mp ?? null);
  return null;
}

export function sensorPixelPitchUm(cam: CameraModule): number | null {
  if (cam.pixel_pitch_um != null && cam.pixel_pitch_um > 0) return cam.pixel_pitch_um;
  return pitchFromSensorModel(cam.sensor_model);
}

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
  return (diagMm / aperture) * framing;
}
