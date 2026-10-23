import { assetUrl } from "../../assetUrl";
import type { DevicesFile } from "../../types/device";

export async function loadDevices(): Promise<DevicesFile> {
  // Bust HTTP/SW caches so Data quality tiers (e.g. complete) show after rebuilds.
  const base = assetUrl("data/devices.json");
  const url = `${base}${base.includes("?") ? "&" : "?"}t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load devices.json (${res.status})`);
  }
  return (await res.json()) as DevicesFile;
}
