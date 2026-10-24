import type { Column } from "@tanstack/react-table";
import type { Device } from "../../types/device";
import { CELLULAR_FILTER_TIERS } from "./cellularTier";
import { NARROW_ID_COLS } from "./deviceTableMeta";
import { capacityOptionMatches, parseCapacityOptionsGb } from "./hardwareSpec";
import { IP_FILTER_TIERS, meetsIpMin } from "./ipRating";

const SCORE_MIN_TIERS = [90, 80, 70, 60, 50, 40, 30];

function MinSelect({
  column,
  options,
  className,
  format = (n: number) => `${n}+`,
}: {
  column: Column<Device, unknown>;
  options: number[];
  className: string;
  format?: (n: number) => string;
}) {
  const selected = (column.getFilterValue() as string | undefined) ?? "";
  return (
    <select
      className={className}
      value={selected}
      aria-label={`${column.id} filter`}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
    >
      <option value="">Any</option>
      {options.map((n) => (
        <option key={n} value={String(n)}>
          {format(n)}
        </option>
      ))}
    </select>
  );
}

function facetedNumbers(column: Column<Device, unknown>): number[] {
  const faceted = column.getFacetedUniqueValues?.();
  if (!faceted) return [];
  return Array.from(faceted.keys())
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a);
}

export function ColumnFilter({ column }: { column: Column<Device, unknown> }) {
  const id = column.id;
  const faceted = column.getFacetedUniqueValues?.();
  const narrow = NARROW_ID_COLS.has(id);

  if (id === "ip_rating") {
    const selected = (column.getFilterValue() as string | undefined) ?? "";
    return (
      <select
        className="ll-col-filter ll-col-filter-narrow ll-col-filter-ip"
        value={selected}
        aria-label={`${id} filter`}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">Any</option>
        {IP_FILTER_TIERS.map((tier) => (
          <option key={tier.value} value={tier.value}>
            {tier.label}
          </option>
        ))}
      </select>
    );
  }

  if (id === "cellular") {
    const selected = (column.getFilterValue() as string | undefined) ?? "";
    return (
      <select
        className="ll-col-filter ll-col-filter-narrow ll-col-filter-cellular"
        value={selected}
        aria-label={`${id} filter`}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">Any</option>
        {CELLULAR_FILTER_TIERS.map((tier) => (
          <option key={tier.value} value={tier.value}>
            {tier.label}
          </option>
        ))}
      </select>
    );
  }

  if (id === "release_year") {
    return (
      <MinSelect
        column={column}
        options={facetedNumbers(column)}
        className="ll-col-filter ll-col-filter-narrow ll-col-filter-year"
      />
    );
  }

  if (
    [
      "ux_score",
      "total_rank",
      "stab",
      "bitrate",
      "total_sensor",
      "overall_score",
      "pp_score",
      "blur_score",
      "slowmo",
      "worth_buy",
      "used_market",
      "maturity",
    ].includes(id)
  ) {
    const nums = facetedNumbers(column);
    const options =
      id === "slowmo" || id === "total_sensor"
        ? nums.length
          ? nums
          : SCORE_MIN_TIERS
        : SCORE_MIN_TIERS.filter((t) => nums.length === 0 || nums.some((n) => n >= t));
    return (
      <MinSelect
        column={column}
        options={options}
        className={`ll-col-filter ll-col-filter-narrow ll-col-filter-${id}`}
      />
    );
  }

  if (id === "ram") {
    const gbSet = new Set<number>();
    for (const row of column.getFacetedRowModel?.()?.flatRows ?? []) {
      for (const gb of parseCapacityOptionsGb(row.original.ram)) {
        gbSet.add(gb);
      }
    }
    const options = Array.from(gbSet).sort((a, b) => a - b);
    const selected = (column.getFilterValue() as string | undefined) ?? "";
    return (
      <select
        className="ll-col-filter ll-col-filter-narrow ll-col-filter-cap"
        value={selected}
        aria-label={`${id} filter`}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">Any</option>
        {options.map((gb) => (
          <option key={gb} value={String(gb)}>
            {gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`}
          </option>
        ))}
      </select>
    );
  }

  const options = faceted
    ? Array.from(faceted.keys())
        .map(String)
        .filter((x) => x && x !== "undefined")
        .sort((a, b) => a.localeCompare(b))
    : [];

  if (options.length > 0 && options.length <= 80 && ["status", "quality", "vendor"].includes(id)) {
    const selected = (column.getFilterValue() as string | undefined) ?? "";
    return (
      <select
        className={
          id === "vendor"
            ? "ll-col-filter ll-col-filter-narrow ll-col-filter-vendor"
            : "ll-col-filter ll-col-filter-narrow"
        }
        value={selected}
        aria-label={`${id} filter`}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      >
        <option value="">Any</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="search"
      className={narrow ? "ll-col-filter ll-col-filter-narrow" : "ll-col-filter"}
      placeholder="…"
      value={(column.getFilterValue() as string) ?? ""}
      aria-label={`${id} filter`}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
    />
  );
}

/** Dropdown min filter: keep rows with numeric value >= selected. */
export function yearMinFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string,
): boolean {
  if (!filterValue) return true;
  const min = Number(filterValue);
  if (!Number.isFinite(min)) return true;
  const raw = row.getValue(columnId);
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return false;
  return n >= min;
}

export function capacityEqualsFilter(
  field: "ram" | "storage",
): (row: { original: Device }, _id: string, filterValue: string) => boolean {
  return (row, _id, filterValue) => {
    if (!filterValue) return true;
    const gb = Number(filterValue);
    if (!Number.isFinite(gb)) return true;
    return capacityOptionMatches(row.original[field], gb);
  };
}

export function equalsFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string,
): boolean {
  if (!filterValue) return true;
  return String(row.getValue(columnId) ?? "") === filterValue;
}

/** IP min tier filter for column defs (uses waterproofing on row). */
export function ipMinFilter(row: { original: Device }, _id: string, filterValue: string): boolean {
  if (!filterValue) return true;
  const min = Number(filterValue);
  if (!Number.isFinite(min)) return true;
  return meetsIpMin(row.original.waterproofing, min);
}
