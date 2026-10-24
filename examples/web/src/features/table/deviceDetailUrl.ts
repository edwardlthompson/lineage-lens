/**
 * Shareable device detail id in the query string (`?device=`).
 * Preserves other table URL params.
 */

export function parseDeviceId(search: string): string | null {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const id = q.get("device")?.trim();
  return id || null;
}

/** Set or clear `device` while keeping other query params + hash. */
export function writeDeviceId(id: string | null): void {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  if (id) q.set("device", id);
  else q.delete("device");
  const qs = q.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) window.history.replaceState(null, "", next);
}
