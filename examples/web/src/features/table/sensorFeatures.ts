/**
 * Sensor capability helpers: estimated max video bitrate + DCG status.
 */
import type {
  CameraFeatures,
  CameraModule,
  DeviceAggregates,
  VideoCapabilities,
} from "../../types/device";
import { enabledFrameRates } from "./cameraFormat";
import { lookupSensor } from "./sensorCatalog";

export type DcgStatus = "confirmed" | "sensor_only" | "none";

/** Bits-per-pixel × chroma factor for a rough phone RAW/YUV readout estimate. */
const EST_BPP_CHROMA = 12 * 1.5; // ~10–12 bpp × 4:2:0-ish chroma inflate

function maxDeviceFps(video: VideoCapabilities | null | undefined): number | null {
  if (!video) return null;
  const rates = [
    ...enabledFrameRates(video["8k"]),
    ...enabledFrameRates(video["4k"]),
    ...enabledFrameRates(video["1080p"]),
  ];
  if (!rates.length) return null;
  return Math.max(...rates);
}

function effectiveMp(cam: CameraModule): number | null {
  if (cam.mp != null && cam.mp > 0) return cam.mp;
  const entry = lookupSensor(cam.sensor_model);
  if (entry?.mp != null && entry.mp > 0) return entry.mp;
  return null;
}

/**
 * Estimated max sensor readout bitrate (Mbps).
 * Prefers catalog `max_readout_mbps` when present; otherwise geometry × device max fps.
 */
export function estimateMaxVideoBitrateMbps(
  cam: CameraModule,
  deviceVideo: VideoCapabilities | null | undefined,
): { mbps: number; estimated: boolean } | null {
  const entry = lookupSensor(cam.sensor_model);
  if (entry?.max_readout_mbps != null && entry.max_readout_mbps > 0) {
    // Catalog readout is a sensor-family assumption, not a measured phone bitrate.
    return { mbps: Math.round(entry.max_readout_mbps), estimated: true };
  }
  const mp = effectiveMp(cam);
  const fps = maxDeviceFps(deviceVideo);
  if (mp == null || fps == null || fps <= 0) return null;
  // Mbps ≈ MP × 1e6 pixels × fps × bpp×chroma / 1e6 bits-per-Mbit
  const raw = (mp * fps * EST_BPP_CHROMA) / 1000;
  if (!Number.isFinite(raw) || raw <= 0) return null;
  const clamped = Math.min(8000, Math.max(50, raw));
  return { mbps: Math.round(clamped), estimated: true };
}

function deviceHasDcg(
  features: CameraFeatures | null | undefined,
  aggregates: DeviceAggregates | null | undefined,
): boolean {
  if (features?.dcg === true) return true;
  if (aggregates?.has_dcg === true) return true;
  return false;
}

function sensorSupportsDcg(sensorModel: string | null | undefined): boolean {
  return lookupSensor(sensorModel)?.dcg === true;
}

/**
 * DCG display status:
 * - confirmed: device camera_features / aggregates say DCG
 * - sensor_only: catalog marks sensor DCG-capable but device does not confirm
 * - none: neither
 */
export function dcgStatus(
  sensorModel: string | null | undefined,
  features: CameraFeatures | null | undefined,
  aggregates?: DeviceAggregates | null,
): DcgStatus {
  const device = deviceHasDcg(features, aggregates ?? null);
  const sensor = sensorSupportsDcg(sensorModel);
  if (device) return "confirmed";
  if (sensor) return "sensor_only";
  return "none";
}

/** Format bitrate + DCG suffixes for a sensor name line. */
export function formatSensorFeatureSuffix(
  bitrate: { mbps: number; estimated: boolean } | null,
  dcg: DcgStatus,
): string {
  const parts: string[] = [];
  if (bitrate) {
    parts.push(bitrate.estimated ? `${bitrate.mbps} Mbps*` : `${bitrate.mbps} Mbps`);
  }
  if (dcg === "confirmed") parts.push("DCG");
  else if (dcg === "sensor_only") parts.push("DCG?");
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}
