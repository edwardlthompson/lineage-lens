import type { CameraModule, Device } from "../../types/device";
import { meaningfulCameras } from "./cameraFormat";
import {
  overallBitrateMbps,
  overallBitrateScoreFromLenses,
  overallBlurFromLenses,
  overallLensScore,
  overallPixelPitchFromLenses,
  overallStabFromLenses,
  totalSensorGeometry,
} from "./deviceLensSummary";
import { bitrateScore, combineLensScore, lensOpticsScore, lensVideoScore } from "./lensScoring";
import {
  backgroundBlurIndex,
  fullFrameEquivalentMm,
  sensorDiagonalMm,
  sensorOpticalFormat,
  sensorPixelPitchUm,
} from "./opticsGeometry";
import { type DcgStatus, dcgStatus, estimateMaxVideoBitrateMbps } from "./sensorFeatures";

export type LensOptics = {
  type: string;
  sensorDiagMm: number | null;
  opticalFormat: string | null;
  pixelPitchUm: number | null;
  focalTrueMm: number | null;
  focalFfEqMm: number | null;
  aperture: number | null;
  blurIndex: number | null;
  sensorModel: string | null;
  ois: boolean | null;
  zoom: number | null;
  lensScore: number | null;
  videoScore: number | null;
  videoNote: string;
  maxBitrateMbps: number | null;
  bitrateEstimated: boolean;
  dcgStatus: DcgStatus;
};

export { overallBitrateMbps } from "./deviceLensSummary";
export {
  bitrateScore,
  blurScore,
  formatBlur,
  formatFfEq,
  lensVideoScore,
  pixelPitchScore,
} from "./lensScoring";
export {
  backgroundBlurIndex,
  fullFrameEquivalentMm,
  sensorDiagonalMm,
} from "./opticsGeometry";

export function analyzeLens(cam: CameraModule, device: Device): LensOptics {
  const diag = sensorDiagonalMm(cam);
  const { ffEq, trueFl } = fullFrameEquivalentMm(cam, diag);
  const blur = backgroundBlurIndex(diag, cam.aperture ?? null, ffEq);
  const video = lensVideoScore(cam.type, device.video, device.aggregates.video_caps_text);
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
  const bitrate = estimateMaxVideoBitrateMbps(cam, device.video);
  const brScore = bitrateScore(bitrate?.mbps ?? null);
  const lensScore = combineLensScore({
    optics,
    bitrate: brScore,
    video: video.score,
  });
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
    maxBitrateMbps: bitrate?.mbps ?? null,
    bitrateEstimated: bitrate?.estimated ?? false,
    dcgStatus: dcgStatus(cam.sensor_model, device.camera_features, device.aggregates),
  };
}

export type DeviceLensAnalysis = {
  lenses: LensOptics[];
  totalSensorDiagMm: number;
  totalSensorAreaMm2: number;
  overallScore: number | null;
  overallPixelPitchScore: number | null;
  overallBlurScore: number | null;
  overallBitrateMbps: number | null;
  overallBitrateScore: number | null;
  overallStabScore: number | null;
};

/** Same Device object → reuse (sort/filter/cells call this dozens of times per row). */
const lensAnalysisCache = new WeakMap<Device, DeviceLensAnalysis>();

export function analyzeDeviceLenses(device: Device): DeviceLensAnalysis {
  const hit = lensAnalysisCache.get(device);
  if (hit) return hit;
  const cams = meaningfulCameras(device.cameras);
  const lenses = cams.map((c) => analyzeLens(c, device));
  const { totalSensorDiagMm, totalSensorAreaMm2 } = totalSensorGeometry(lenses);
  const analysis: DeviceLensAnalysis = {
    lenses,
    totalSensorDiagMm,
    totalSensorAreaMm2,
    overallScore: overallLensScore(lenses),
    overallPixelPitchScore: overallPixelPitchFromLenses(lenses),
    overallBlurScore: overallBlurFromLenses(lenses),
    overallBitrateMbps: overallBitrateMbps(lenses),
    overallBitrateScore: overallBitrateScoreFromLenses(lenses),
    overallStabScore: overallStabFromLenses(lenses),
  };
  lensAnalysisCache.set(device, analysis);
  return analysis;
}
