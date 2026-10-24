/** Table vs dedicated charts page (`?view=charts`). */

export type HomeView = "table" | "charts";

export function parseHomeView(search: string): HomeView {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return q.get("view") === "charts" ? "charts" : "table";
}

export function writeHomeView(view: HomeView): void {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  if (view === "charts") q.set("view", "charts");
  else q.delete("view");
  const qs = q.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) window.history.replaceState(null, "", next);
}
