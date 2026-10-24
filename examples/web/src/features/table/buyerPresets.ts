/**
 * Buyer sort/filter packs (Phase 3).
 */
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

export type BuyerPresetId = "portrait" | "travel" | "creator" | "night";

export type BuyerPreset = {
  id: BuyerPresetId;
  sorting: SortingState;
  /** Soft hints — applied as columnFilters where meaningful. */
  columnFilters: ColumnFiltersState;
};

export const BUYER_PRESETS: Record<BuyerPresetId, BuyerPreset> = {
  portrait: {
    id: "portrait",
    sorting: [
      { id: "blur_score", desc: true },
      { id: "pp_score", desc: true },
    ],
    columnFilters: [],
  },
  travel: {
    id: "travel",
    sorting: [
      { id: "total_sensor", desc: true },
      { id: "ux_score", desc: true },
    ],
    columnFilters: [],
  },
  creator: {
    id: "creator",
    sorting: [
      { id: "overall_score", desc: true },
      { id: "slowmo", desc: true },
    ],
    columnFilters: [],
  },
  night: {
    id: "night",
    sorting: [
      { id: "pp_score", desc: true },
      { id: "total_sensor", desc: true },
    ],
    columnFilters: [],
  },
};

export function applyBuyerPreset(id: BuyerPresetId | ""): {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
} | null {
  if (!id) return null;
  const p = BUYER_PRESETS[id];
  if (!p) return null;
  return { sorting: [...p.sorting], columnFilters: [...p.columnFilters] };
}
