/**
 * Datasheet-backed sensor lookup (Wikipedia ISOCELL + curated Sony/OV listings).
 * Generated payload: sensorCatalog.generated.ts
 */
import {
  SENSOR_ALIASES,
  SENSOR_CATALOG,
  TYPE1_MM,
  type SensorCatalogEntry,
} from "./sensorCatalog.generated";

export { TYPE1_MM };
export type { SensorCatalogEntry };

function norm(model: string): string {
  return model.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function lookupSensor(model: string | null | undefined): SensorCatalogEntry | null {
  if (!model) return null;
  const key = norm(model);
  if (SENSOR_CATALOG[key]) return SENSOR_CATALOG[key];
  const aliased = SENSOR_ALIASES[key];
  if (aliased && SENSOR_CATALOG[aliased]) return SENSOR_CATALOG[aliased];
  for (const prefix of ["SONY", "SAMSUNG", "OMNIVISION", "ISOCELL", "S5K"]) {
    if (key.startsWith(prefix)) {
      const bare = key.slice(prefix.length);
      if (SENSOR_CATALOG[bare]) return SENSOR_CATALOG[bare];
      if (SENSOR_CATALOG[`S5K${bare}`]) return SENSOR_CATALOG[`S5K${bare}`];
    }
  }
  if (key.startsWith("S5K") && SENSOR_CATALOG[key.slice(3)]) return SENSOR_CATALOG[key.slice(3)];
  return null;
}

export function diagFromSensorModel(model: string | null | undefined): number | null {
  const entry = lookupSensor(model);
  if (!entry) return null;
  if (entry.diag_mm != null) return entry.diag_mm;
  const fmt = entry.optical_format?.replace(/"/g, "");
  if (fmt?.startsWith("1/")) {
    const d = Number(fmt.split("/")[1]);
    return d > 0 ? TYPE1_MM / d : null;
  }
  return null;
}

export function pitchFromSensorModel(model: string | null | undefined): number | null {
  return lookupSensor(model)?.pixel_pitch_um ?? null;
}

export function formatFromSensorModel(model: string | null | undefined): string | null {
  return lookupSensor(model)?.optical_format ?? null;
}

/** Typical selfie optical format when only MP is known. */
export function estimateFrontDiagFromMp(mp: number | null | undefined): number | null {
  if (mp == null || mp <= 0) return null;
  if (mp >= 40) return TYPE1_MM / 2.5;
  if (mp >= 24) return TYPE1_MM / 2.8;
  if (mp >= 16) return TYPE1_MM / 3.0;
  if (mp >= 10) return TYPE1_MM / 3.4;
  if (mp >= 5) return TYPE1_MM / 4.0;
  return TYPE1_MM / 5.0;
}
