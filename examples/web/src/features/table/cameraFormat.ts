import type { CameraModule, VideoCapabilities } from "../../types/device";

const TYPE_LABEL: Record<string, string> = {
  main: "Main",
  wide: "Wide",
  ultrawide: "UW",
  telephoto: "Tele",
  macro: "Macro",
  depth: "Depth",
  front: "Front",
  other: "Other",
};

function usableFlash(flash: string | null | undefined): string | null {
  if (!flash) return null;
  const s = flash.trim();
  if (!s || s.toLowerCase() === "none") return null;
  return s;
}

/** True when the module has optic/sensor fields beyond megapixels. */
export function cameraHasHardwareSpecs(cam: CameraModule): boolean {
  return (
    cam.sensor_size_mm != null ||
    cam.optical_format != null ||
    cam.pixel_pitch_um != null ||
    cam.focal_length_mm != null ||
    cam.fov_deg != null ||
    cam.aperture != null ||
    cam.ois === true ||
    cam.zoom != null ||
    Boolean(cam.sensor_model) ||
    usableFlash(cam.flash) != null
  );
}

/** Modules worth listing (includes wiki role/flash rows; drops empty CSV stubs). */
export function meaningfulCameras(cameras: CameraModule[]): CameraModule[] {
  return cameras.filter((c) => {
    if (cameraHasHardwareSpecs(c)) return true;
    if (c.info?.trim()) return true;
    if (c.mp != null) return true;
    return false;
  });
}

export function cameraTypeLabel(type: string): string {
  return TYPE_LABEL[type] ?? type;
}

export function formatOpticalFormat(fmt: string | null | undefined): string | null {
  if (!fmt) return null;
  const s = fmt.trim();
  if (!s) return null;
  if (s.includes("/")) return s;
  if (/^\d+(\.\d+)?$/.test(s)) return `1/${s}"`;
  return s;
}

/** Lens role from wiki info parentheses, without megapixel text. */
export function lensRoleFromInfo(info: string | null | undefined): string | null {
  if (!info) return null;
  const m = info.match(/\(([^)]+)\)/);
  if (!m) return null;
  const role = m[1].trim();
  return role || null;
}

/**
 * Hardware summary — sensor geometry / optics / OIS / zoom first.
 * Megapixels omitted (aftermarket apps are often capped near 12 MP).
 */
export function formatCameraHardwareLine(cam: CameraModule): string {
  const parts: string[] = [];
  const opt = formatOpticalFormat(cam.optical_format ?? undefined);
  if (cam.sensor_size_mm != null) {
    parts.push(`${cam.sensor_size_mm.toFixed(1)} mm diag`);
  } else if (opt) {
    parts.push(opt);
  }
  if (opt && cam.sensor_size_mm != null) parts.push(opt);
  if (cam.pixel_pitch_um != null) parts.push(`${cam.pixel_pitch_um} µm`);
  if (cam.focal_length_mm != null) parts.push(`${cam.focal_length_mm} mm`);
  if (cam.fov_deg != null) parts.push(`${cam.fov_deg}°`);
  if (cam.aperture != null) parts.push(`f/${cam.aperture}`);
  if (cam.zoom != null) parts.push(`${cam.zoom}× zoom`);
  if (cam.ois === true) parts.push("OIS");
  else if (
    cam.ois === false &&
    (cam.sensor_size_mm != null || cam.optical_format != null || cam.pixel_pitch_um != null)
  ) {
    parts.push("no OIS");
  }
  if (cam.sensor_model) parts.push(cam.sensor_model);
  const flash = usableFlash(cam.flash);
  if (flash) parts.push(`${flash} flash`);

  // Wiki rows: surface lens role when we lack deep geometry
  const role = lensRoleFromInfo(cam.info);
  if (role && cam.sensor_size_mm == null && !opt) {
    parts.unshift(role);
  }

  if (parts.length > 0) return parts.join(" · ");
  if (role) return role;
  return "wiki module";
}

/** Compact stacked lines for narrow columns (one fact per line). */
export function formatCameraHardwareLines(cam: CameraModule): string[] {
  const line = formatCameraHardwareLine(cam);
  if (!line || line === "—") return [];
  return line
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** fps keys that are numeric frame rates (ignore HDR flags). */
export function enabledFrameRates(flags: Record<string, boolean | null> | undefined): number[] {
  if (!flags) return [];
  const rates: number[] = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    if (!/^\d+$/.test(key)) continue;
    rates.push(Number(key));
  }
  return rates.sort((a, b) => a - b);
}

export function videoFeatureFlags(flags: Record<string, boolean | null> | undefined): string[] {
  if (!flags) return [];
  const out: string[] = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    if (/^\d+$/.test(key)) continue;
    out.push(key);
  }
  return out;
}

export function formatFpsList(rates: number[]): string {
  if (rates.length === 0) return "—";
  return rates.map((r) => `${r}`).join("/") + " fps";
}

export function summarizeVideo(video: VideoCapabilities | null | undefined): {
  p1080: string;
  p4k: string;
  features: string[];
} {
  if (!video) {
    return { p1080: "—", p4k: "—", features: [] };
  }
  const f1080 = enabledFrameRates(video["1080p"]);
  const f4k = enabledFrameRates(video["4k"]);
  const features = [...videoFeatureFlags(video["1080p"]), ...videoFeatureFlags(video["4k"])];
  return {
    p1080: f1080.length ? `1080p @ ${formatFpsList(f1080)}` : "1080p —",
    p4k: f4k.length ? `4K @ ${formatFpsList(f4k)}` : "4K —",
    features,
  };
}
