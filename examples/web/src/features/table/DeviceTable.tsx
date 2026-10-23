import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type Column,
  type ColumnFiltersState,
  type Row,
  type SortingFn,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../../i18n";
import type { Device, DevicesFile } from "../../types/device";
import { meaningfulCameras } from "./cameraFormat";
import { CompareProvider } from "./CompareContext";
import { computeCompareWins, type CompareWins } from "./compareWins";
import { formatTopSpecLine } from "./hardwareSpec";
import { compareOpticsThenPerformance } from "./performanceTieBreak";
import { IP_FILTER_TIERS, meetsIpMin } from "./ipRating";
import { loadDevices } from "./loadDevices";
import { sortModelsForNaEbay } from "./modelNumbers";
import { analyzeDeviceLenses } from "./opticsMath";
import { rankOrUndefined, sensorTotalOrUndefined } from "./sortRank";
import {
  BlurStackCell,
  FocalStackCell,
  IpRatingCell,
  LensScoreStackCell,
  PixelPitchStackCell,
  SensorNameStackCell,
  SensorStackCell,
} from "./StackedLensCells";
import { VideoCapsCell } from "./VideoCapsCell";

const col = createColumnHelper<Device>();

const STACK_COL_IDS = [
  "total_sensor",
  "pp_score",
  "focal_lengths",
  "blur_score",
  "sensor_names",
  "overall_score",
] as const;

const NARROW_ID_COLS = new Set(["vendor", "name", "codename", "release_year", "ip_rating"]);

/** First click: high→low so best / newest rows land on top. */
export const SORT_DESC_FIRST_IDS = new Set([
  "release_year",
  "total_sensor",
  "pp_score",
  "blur_score",
  "overall_score",
]);

/** Optics column sort: equal scores break on SoC / RAM / storage. */
const opticsThenPerfSort: SortingFn<Device> = (
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

function lineageLabel(d: Device): string {
  if (d.lineage_label) return d.lineage_label;
  if (d.status === "current" && d.current_branch) return String(d.current_branch);
  if (d.status === "experimental") return "experimental";
  if (d.status === "discontinued") return "discontinued";
  return d.current_branch ? String(d.current_branch) : "discontinued";
}

function headerCellClass(id: string): string | undefined {
  if (id === "compare") return "ll-th-compare";
  if (id === "ip_rating") return "ll-th-ip-col";
  if (id === "release_year") return "ll-th-year-col";
  if (id === "model_specs") return "ll-th-specs-col";
  if (STACK_COL_IDS.includes(id as (typeof STACK_COL_IDS)[number])) return "ll-th-stack-col";
  if (NARROW_ID_COLS.has(id)) return "ll-th-id-col";
  return undefined;
}

function bodyCellClass(id: string): string | undefined {
  if (id === "compare") return "ll-td-compare";
  if (id === "ip_rating") return "ll-td-ip-col";
  if (id === "release_year") return "ll-td-year-col";
  if (id === "model_specs") return "ll-td-specs-col";
  if (STACK_COL_IDS.includes(id as (typeof STACK_COL_IDS)[number])) return "ll-td-stack-col";
  if (NARROW_ID_COLS.has(id)) return "ll-td-id-col";
  if (id === "video") return "ll-td-video";
  return undefined;
}

/** Codename with NA-first retail model numbers for eBay part-number search. */
function CodenameModelsCell({ device }: { device: Device }) {
  const models = sortModelsForNaEbay(device.models);
  return (
    <div className="ll-codename-cell">
      <div className="ll-codename-main">{device.codename}</div>
      {models.length > 0 ? (
        <ul className="ll-stack ll-model-stack" aria-label="Model numbers">
          {models.map((m) => (
            <li key={m} className="ll-stack-item ll-model-num">
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Top SoC/RAM/storage lines aligned with each model number under codename. */
function ModelTopSpecCell({ device }: { device: Device }) {
  const models = sortModelsForNaEbay(device.models);
  const line = formatTopSpecLine(device);
  if (!line && models.length === 0) return <span className="ll-muted">—</span>;
  if (models.length === 0) {
    return <span className="ll-spec-line">{line}</span>;
  }
  return (
    <div className="ll-codename-cell">
      <div className="ll-codename-main ll-spec-spacer" aria-hidden="true">
        {"\u00a0"}
      </div>
      <ul className="ll-stack ll-model-stack" aria-label="Top specs">
        {models.map((m) => (
          <li key={m} className="ll-stack-item ll-spec-line">
            {line ?? "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColumnFilter({ column }: { column: Column<Device, unknown> }) {
  const id = column.id;
  const faceted = column.getFacetedUniqueValues?.();
  const isNumeric = [
    "total_sensor",
    "overall_score",
    "pp_score",
    "blur_score",
    "release_year",
  ].includes(id);
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

  if (isNumeric) {
    const v = (column.getFilterValue() as [number | undefined, number | undefined]) ?? [
      undefined,
      undefined,
    ];
    return (
      <div className="ll-col-filter ll-col-filter-range">
        <input
          type="number"
          step="any"
          placeholder="min"
          value={v[0] ?? ""}
          aria-label={`${id} min`}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            column.setFilterValue((old: [number | undefined, number | undefined] | undefined) => [
              n,
              old?.[1],
            ]);
          }}
        />
        <input
          type="number"
          step="any"
          placeholder="max"
          value={v[1] ?? ""}
          aria-label={`${id} max`}
          onChange={(e) => {
            const n = e.target.value === "" ? undefined : Number(e.target.value);
            column.setFilterValue((old: [number | undefined, number | undefined] | undefined) => [
              old?.[0],
              n,
            ]);
          }}
        />
      </div>
    );
  }

  const options = faceted
    ? Array.from(faceted.keys())
        .map(String)
        .filter((x) => x && x !== "undefined")
        .sort((a, b) => a.localeCompare(b))
    : [];

  if (
    options.length > 0 &&
    options.length <= 80 &&
    ["status", "quality", "vendor"].includes(id)
  ) {
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

function rangeFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: [number | undefined, number | undefined],
): boolean {
  const [min, max] = filterValue ?? [];
  const raw = row.getValue(columnId);
  const n = typeof raw === "number" ? raw : Number.NaN;
  if (Number.isNaN(n)) return min == null && max == null;
  if (min != null && n < min) return false;
  if (max != null && n > max) return false;
  return true;
}

function equalsFilter(
  row: { getValue: (id: string) => unknown },
  columnId: string,
  filterValue: string,
): boolean {
  if (!filterValue) return true;
  return String(row.getValue(columnId) ?? "") === filterValue;
}

export function DeviceTable() {
  const [data, setData] = useState<DevicesFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "overall_score", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [enrichedOnly, setEnrichedOnly] = useState(false);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    const sync = () => setToolbarSlot(document.getElementById("ll-home-toolbar-slot"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadDevices()
      .then((file) => {
        if (!cancelled) setData(file);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load devices");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setComparing(false);
  }, []);

  const columns = useMemo(
    () => [
      col.display({
        id: "compare",
        header: () => (
          <span className="gp-visually-hidden">{t("table.col.compare")}</span>
        ),
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="ll-compare-check"
            checked={selectedIds.has(row.original.id)}
            onChange={() => toggleSelected(row.original.id)}
            aria-label={t("table.compareSelect").replace("{name}", row.original.name)}
            data-testid={`compare-check-${row.original.id}`}
          />
        ),
      }),
      col.accessor("vendor", {
        header: () => t("table.col.vendor"),
        sortingFn: "alphanumeric",
        filterFn: equalsFilter,
      }),
      col.accessor("name", {
        header: () => t("table.col.device"),
        sortingFn: "alphanumeric",
        filterFn: "includesString",
      }),
      col.accessor("codename", {
        header: () => t("table.col.codename"),
        cell: ({ row }) => <CodenameModelsCell device={row.original} />,
        sortingFn: "alphanumeric",
        filterFn: (row, _id, filterValue: string) => {
          if (!filterValue) return true;
          const q = filterValue.toLowerCase();
          const d = row.original;
          if (d.codename.toLowerCase().includes(q)) return true;
          return (d.models ?? []).some((m) => m.toLowerCase().includes(q));
        },
      }),
      col.accessor((r) => formatTopSpecLine(r) ?? "", {
        id: "model_specs",
        header: () => t("table.col.specs"),
        cell: ({ row }) => <ModelTopSpecCell device={row.original} />,
        enableSorting: false,
        filterFn: "includesString",
      }),
      col.accessor((r) => rankOrUndefined(r.release_year), {
        id: "release_year",
        header: () => t("table.col.year"),
        cell: ({ getValue }) => {
          const y = getValue();
          return y == null ? "—" : String(y);
        },
        sortingFn: "basic",
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: rangeFilter,
      }),
      col.accessor((r) => sensorTotalOrUndefined(analyzeDeviceLenses(r).totalSensorDiagMm), {
        id: "total_sensor",
        header: () => t("table.col.sensors"),
        cell: ({ row }) => <SensorStackCell device={row.original} />,
        sortingFn: opticsThenPerfSort,
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: rangeFilter,
      }),
      col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallPixelPitchScore), {
        id: "pp_score",
        header: () => t("table.col.pixelPitch"),
        cell: ({ row }) => <PixelPitchStackCell device={row.original} />,
        sortingFn: opticsThenPerfSort,
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: rangeFilter,
      }),
      col.display({
        id: "focal_lengths",
        header: () => t("table.col.focal"),
        enableColumnFilter: true,
        filterFn: (row, _id, filterValue: string) => {
          if (!filterValue) return true;
          const q = filterValue.toLowerCase();
          return analyzeDeviceLenses(row.original).lenses.some((l) =>
            `${l.focalFfEqMm ?? ""}`.toLowerCase().includes(q),
          );
        },
        cell: ({ row }) => <FocalStackCell device={row.original} />,
      }),
      col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallBlurScore), {
        id: "blur_score",
        header: () => t("table.col.blur"),
        cell: ({ row }) => <BlurStackCell device={row.original} />,
        sortingFn: opticsThenPerfSort,
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: rangeFilter,
      }),
      col.display({
        id: "sensor_names",
        header: () => t("table.col.sensorName"),
        enableColumnFilter: true,
        filterFn: (row, _id, filterValue: string) => {
          if (!filterValue) return true;
          const q = filterValue.toLowerCase();
          return row.original.cameras.some((c) =>
            (c.sensor_model ?? "").toLowerCase().includes(q),
          );
        },
        cell: ({ row }) => <SensorNameStackCell device={row.original} />,
      }),
      col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallScore), {
        id: "overall_score",
        header: () => t("table.col.scores"),
        cell: ({ row }) => <LensScoreStackCell device={row.original} />,
        sortingFn: opticsThenPerfSort,
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: rangeFilter,
      }),
      col.display({
        id: "video",
        header: () => t("table.col.video"),
        enableColumnFilter: true,
        filterFn: (row, _id, filterValue: string) => {
          if (!filterValue) return true;
          const q = filterValue.toLowerCase();
          const text =
            JSON.stringify(row.original.video ?? {}) +
            (row.original.aggregates.video_caps_text ?? "");
          return text.toLowerCase().includes(q);
        },
        cell: ({ row }) => <VideoCapsCell video={row.original.video} />,
      }),
      col.accessor((r) => r.waterproofing ?? "", {
        id: "ip_rating",
        header: () => t("table.col.ip"),
        cell: ({ row }) => <IpRatingCell device={row.original} />,
        filterFn: (row, _id, filterValue: string) => {
          if (!filterValue) return true;
          const min = Number(filterValue);
          if (!Number.isFinite(min)) return true;
          return meetsIpMin(row.original.waterproofing, min);
        },
        sortingFn: "alphanumeric",
      }),
      col.accessor((r) => lineageLabel(r), {
        id: "status",
        header: () => t("table.col.status"),
        cell: ({ row }) => lineageLabel(row.original),
        filterFn: equalsFilter,
        sortingFn: "alphanumeric",
      }),
      col.accessor((r) => r.provenance.quality, {
        id: "quality",
        header: () => t("table.col.data"),
        filterFn: equalsFilter,
      }),
    ],
    [selectedIds, toggleSelected],
  );

  const prefiltered = useMemo(() => {
    let rows = data?.devices ?? [];
    if (enrichedOnly) {
      rows = rows.filter((d) => meaningfulCameras(d.cameras).length > 0);
    }
    if (comparing) {
      rows = rows.filter((d) => selectedIds.has(d.id));
    }
    return rows;
  }, [data, enrichedOnly, comparing, selectedIds]);

  const compareWins: CompareWins | null = useMemo(() => {
    if (!comparing || selectedIds.size < 2 || !data) return null;
    const picked = data.devices.filter((d) => selectedIds.has(d.id));
    return computeCompareWins(picked);
  }, [comparing, selectedIds, data]);

  const table = useReactTable({
    data: prefiltered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row) => row.id,
  });

  if (error) {
    return (
      <div className="ll-table-wrap" data-testid="device-table">
        <p className="gp-body" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ll-table-wrap" data-testid="device-table">
        <p className="gp-body">{t("table.loading")}</p>
      </div>
    );
  }

  const shown = table.getRowModel().rows.length;
  const canCompare = selectedIds.size >= 2;

  const homeToolbar =
    toolbarSlot != null
      ? createPortal(
          <>
            <label className="ll-filter-toggle">
              <input
                type="checkbox"
                checked={enrichedOnly}
                onChange={(e) => setEnrichedOnly(e.target.checked)}
                data-testid="enriched-only"
              />
              {t("table.enrichedOnly")}
            </label>
            <button
              type="button"
              className="ll-clear-filters"
              data-testid="compare-btn"
              disabled={!canCompare && !comparing}
              onClick={() => {
                if (comparing) setComparing(false);
                else if (canCompare) setComparing(true);
              }}
            >
              {comparing ? t("table.exitCompare") : t("table.compare")}
            </button>
            <button
              type="button"
              className="ll-clear-filters"
              onClick={() => {
                setColumnFilters([]);
                setEnrichedOnly(false);
                setComparing(false);
                setSelectedIds(new Set());
              }}
            >
              {t("table.clearFilters")}
            </button>
          </>,
          toolbarSlot,
        )
      : null;

  return (
    <div className="ll-table-wrap" data-testid="device-table">
      {homeToolbar}
      <div className="ll-table-toolbar">
        <p className="ll-table-meta" data-testid="device-stats">
          {comparing
            ? t("table.compareStats")
                .replace("{count}", String(shown))
                .replace("{selected}", String(selectedIds.size))
            : t("table.stats")
                .replace("{shown}", String(shown))
                .replace("{total}", String(data.device_count))
                .replace("{complete}", String(data.complete_count ?? 0))
                .replace("{enriched}", String(data.enriched_count))}
        </p>
      </div>
      <div className="ll-table-scroll">
        <table className={`ll-table ll-table-wide${comparing ? " ll-table-comparing" : ""}`}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={headerCellClass(header.column.id)}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="ll-th-stack">
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="ll-th-btn"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? ""}
                          </button>
                        ) : (
                          <span className="ll-th-static">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                        )}
                        {header.column.getCanFilter() ? (
                          <ColumnFilter column={header.column} />
                        ) : null}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <CompareProvider
                key={row.id}
                value={{
                  comparing,
                  deviceId: row.original.id,
                  wins: compareWins,
                }}
              >
                <tr className={selectedIds.has(row.original.id) ? "ll-row-selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={bodyCellClass(cell.column.id)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              </CompareProvider>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
