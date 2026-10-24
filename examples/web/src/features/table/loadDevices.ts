import { assetUrl } from "../../assetUrl";
import type { DevicesFile } from "../../types/device";
import { deviceCategory } from "./deviceCategory";
import { analyzeDeviceLenses } from "./opticsMath";

/** One in-flight / resolved fetch shared by table + charts views. */
let cached: Promise<DevicesFile> | null = null;

/**
 * Load the device catalog. Allow HTTP/SW caching — pipeline rebuilds change
 * `generated_at` / file bytes. Avoid per-load cache busting.
 */
export async function loadDevices(): Promise<DevicesFile> {
  if (!cached) {
    cached = (async () => {
      const res = await fetch(assetUrl("data/devices.json"));
      if (!res.ok) {
        cached = null;
        throw new Error(`Failed to load devices.json (${res.status})`);
      }
      const file = (await res.json()) as DevicesFile;
      for (const device of file.devices ?? []) {
        if (deviceCategory(device.type) === "phone") analyzeDeviceLenses(device);
      }
      return file;
    })();
  }
  return cached;
}

/** Test helper — drop the shared promise between cases. */
export function resetDevicesCache(): void {
  cached = null;
}
