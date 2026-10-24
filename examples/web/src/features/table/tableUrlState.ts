/**
 * Shareable table state ↔ URL query (static Pages friendly).
 */
import type { ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";

export type TableUrlState = {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  columnVisibility: VisibilityState;
  enrichedOnly: boolean;
  comparing: boolean;
};

const DEFAULT_SORT: SortingState = [{ id: "overall_score", desc: true }];

function encodeJson(value: unknown): string {
  return encodeURIComponent(JSON.stringify(value));
}

function decodeJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return fallback;
  }
}

/** Read table state from `location.search`. */
export function parseTableUrl(search: string): Partial<TableUrlState> {
  const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Partial<TableUrlState> = {};
  if (q.has("sort")) out.sorting = decodeJson(q.get("sort"), DEFAULT_SORT);
  if (q.has("cf")) out.columnFilters = decodeJson(q.get("cf"), []);
  if (q.has("q")) out.globalFilter = q.get("q") ?? "";
  if (q.has("cols")) out.columnVisibility = decodeJson(q.get("cols"), {});
  if (q.has("cam")) out.enrichedOnly = q.get("cam") === "1";
  if (q.has("cmp")) out.comparing = q.get("cmp") === "1";
  return out;
}

/** Build query string (no leading ?). Omits defaults to keep links short. */
export function serializeTableUrl(state: TableUrlState, preserveDevice?: string | null): string {
  const q = new URLSearchParams();
  const sortDefault =
    state.sorting.length === 1 &&
    state.sorting[0]?.id === "overall_score" &&
    state.sorting[0]?.desc === true;
  if (!sortDefault && state.sorting.length) q.set("sort", encodeJson(state.sorting));
  if (state.columnFilters.length) q.set("cf", encodeJson(state.columnFilters));
  if (state.globalFilter.trim()) q.set("q", state.globalFilter.trim());
  if (Object.keys(state.columnVisibility).length) {
    q.set("cols", encodeJson(state.columnVisibility));
  }
  if (state.enrichedOnly) q.set("cam", "1");
  if (state.comparing) q.set("cmp", "1");
  if (preserveDevice) q.set("device", preserveDevice);
  return q.toString();
}

/** Replace URL search without navigation. Keeps `device` detail and `view=charts`. */
export function writeTableUrl(state: TableUrlState): void {
  if (typeof window === "undefined") return;
  const curQ = new URLSearchParams(window.location.search);
  const device = curQ.get("device");
  const qs = serializeTableUrl(state, device);
  const merged = new URLSearchParams(qs);
  if (curQ.get("view") === "charts") merged.set("view", "charts");
  const finalQs = merged.toString();
  const next = finalQs
    ? `${window.location.pathname}?${finalQs}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== cur) window.history.replaceState(null, "", next);
}
