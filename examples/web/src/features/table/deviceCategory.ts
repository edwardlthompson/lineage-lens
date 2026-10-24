/** Phone chart vs tablets, TVs/boxes, and handheld gaming devices. */

export type DeviceCategory = "phone" | "tablet" | "tv" | "gaming";

const CATS: DeviceCategory[] = ["phone", "tablet", "tv", "gaming"];

export function parseDeviceCategory(search: string): DeviceCategory {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = q.get("cat");
  return CATS.includes(raw as DeviceCategory) ? (raw as DeviceCategory) : "phone";
}

export function writeDeviceCategory(cat: DeviceCategory): void {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  if (cat === "phone") q.delete("cat");
  else q.set("cat", cat);
  const qs = q.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) window.history.replaceState(null, "", next);
}

/** Phones stay on the main chart. TVs include set-top boxes and dev boards. */
export function deviceCategory(type: string | null | undefined): DeviceCategory {
  const t = (type ?? "").toLowerCase();
  if (t === "tablet") return "tablet";
  if (t === "tv" || t === "set top box" || t === "devkit") return "tv";
  if (t.includes("game") || t.includes("handheld")) return "gaming";
  return "phone";
}
