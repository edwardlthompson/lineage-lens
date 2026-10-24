import type { Row, SortingFn } from "@tanstack/react-table";
import type { Device } from "../../types/device";
import { compareOpticsThenPerformance } from "./performanceTieBreak";

export const STACK_COL_IDS = [
  "total_sensor",
  "pp_score",
  "focal_lengths",
  "stab",
  "blur_score",
  "sensor_names",
  "bitrate",
  "overall_score",
] as const;

export const NARROW_ID_COLS = new Set([
  "vendor",
  "name",
  "codename",
  "release_year",
  "ip_rating",
  "soc",
  "ram",
  "ux_score",
  "status",
]);

/** First click: high→low so best / newest rows land on top. */
export const SORT_DESC_FIRST_IDS = new Set([
  "release_year",
  "total_sensor",
  "pp_score",
  "blur_score",
  "stab",
  "bitrate",
  "overall_score",
  "total_rank",
  "ram",
  "ux_score",
  "slowmo",
  "worth_buy",
  "used_market",
  "maturity",
]);

/** Optics column sort: equal scores break on SoC / RAM. */
export const opticsThenPerfSort: SortingFn<Device> = (
  rowA: Row<Device>,
  rowB: Row<Device>,
  columnId: string,
) =>
  compareOpticsThenPerformance(
    rowA.getValue(columnId) as number | null,
    rowA.original,
    rowB.getValue(columnId) as number | null,
    rowB.original,
  );

export function lineageLabel(d: Device): string {
  if (d.lineage_label) return d.lineage_label;
  if (d.status === "current" && d.current_branch) return String(d.current_branch);
  if (d.status === "experimental") return "experimental";
  if (d.status === "discontinued") return "discontinued";
  return d.current_branch ? String(d.current_branch) : "discontinued";
}

export function headerCellClass(id: string): string | undefined {
  if (id === "compare") return "ll-th-compare";
  if (id === "ip_rating") return "ll-th-ip-col";
  if (id === "release_year") return "ll-th-year-col";
  if (id === "soc") return "ll-th-soc-col";
  if (id === "ram") return "ll-th-cap-col";
  if (id === "battery") return "ll-th-battery-col";
  if (id === "ux_score") return "ll-th-ux-col";
  if (id === "status") return "ll-th-ver-col";
  if (STACK_COL_IDS.includes(id as (typeof STACK_COL_IDS)[number])) return "ll-th-stack-col";
  if (NARROW_ID_COLS.has(id)) return "ll-th-id-col";
  return undefined;
}

export function bodyCellClass(id: string): string | undefined {
  if (id === "compare") return "ll-td-compare";
  if (id === "name") return "ll-td-name";
  if (id === "ip_rating") return "ll-td-ip-col";
  if (id === "release_year") return "ll-td-year-col";
  if (id === "soc") return "ll-td-soc-col";
  if (id === "ram") return "ll-td-cap-col";
  if (id === "battery") return "ll-td-battery-col";
  if (id === "ux_score") return "ll-td-ux-col";
  if (id === "status") return "ll-td-ver-col";
  if (STACK_COL_IDS.includes(id as (typeof STACK_COL_IDS)[number])) return "ll-td-stack-col";
  if (NARROW_ID_COLS.has(id)) return "ll-td-id-col";
  if (id === "video") return "ll-td-video";
  return undefined;
}
