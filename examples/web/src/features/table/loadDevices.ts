import type { DevicesFile } from "../../types/device";
import { assetUrl } from "../../assetUrl";

export async function loadDevices(): Promise<DevicesFile> {
  const url = assetUrl("data/devices.json");
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load devices.json (${res.status})`);
  }
  return (await res.json()) as DevicesFile;
}
