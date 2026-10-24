import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { t } from "../../i18n";
import type { DevicesFile } from "../../types/device";
import { ChartsPage } from "../charts/ChartsPage";
import { buildDeviceColumns } from "./buildDeviceColumns";
import type { BuyerPresetId } from "./buyerPresets";
import { CompareBar } from "./CompareBar";
import { meaningfulCameras } from "./cameraFormat";
import { DEFAULT_HIDDEN_COLUMNS, TABLET_COLUMN_VISIBILITY } from "./columnVisibility";
import { type CompareWins, computeCompareWins } from "./compareWins";
import { DeviceDataGrid } from "./DeviceDataGrid";
import { DeviceDetailPanel } from "./DeviceDetailPanel";
import { DeviceTableToolbar } from "./DeviceTableToolbar";
import { countDataQualityStats } from "./dataQualityLabel";
import {
  type DeviceCategory,
  deviceCategory,
  parseDeviceCategory,
  writeDeviceCategory,
} from "./deviceCategory";
import { parseDeviceId, writeDeviceId } from "./deviceDetailUrl";
import { deviceSearchBlob, fuzzyMatch } from "./fuzzySearch";
import { type HomeView, parseHomeView, writeHomeView } from "./homeView";
import { loadDevices } from "./loadDevices";
import { analyzeDeviceLenses } from "./opticsMath";
import { findSimilarDevices, type SimilarHit } from "./similarDevices";
import { useTableUrlSync } from "./useTableUrlSync";

export { yearMinFilter } from "./deviceTableFilters";
export { SORT_DESC_FIRST_IDS } from "./deviceTableMeta";

export function DeviceTable() {
  const [view, setView] = useState<HomeView>(() =>
    typeof window !== "undefined" ? parseHomeView(window.location.search) : "table",
  );
  const [category, setCategory] = useState<DeviceCategory>(() =>
    typeof window !== "undefined" ? parseDeviceCategory(window.location.search) : "phone",
  );
  const [data, setData] = useState<DevicesFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "overall_score", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [enrichedOnly, setEnrichedOnly] = useState(false);
  const [toolbarSlot, setToolbarSlot] = useState<HTMLElement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [comparing, setComparing] = useState(false);
  const [buyerPreset, setBuyerPreset] = useState<BuyerPresetId | "">("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const cat =
      typeof window !== "undefined" ? parseDeviceCategory(window.location.search) : "phone";
    return cat === "tablet"
      ? { ...DEFAULT_HIDDEN_COLUMNS, ...TABLET_COLUMN_VISIBILITY }
      : { ...DEFAULT_HIDDEN_COLUMNS };
  });
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [similarHints, setSimilarHints] = useState<SimilarHit[]>([]);
  const [detailId, setDetailId] = useState<string | null>(() =>
    typeof window !== "undefined" ? parseDeviceId(window.location.search) : null,
  );

  useTableUrlSync(
    { sorting, columnFilters, globalFilter, columnVisibility, enrichedOnly, comparing },
    {
      setSorting,
      setColumnFilters,
      setGlobalFilter,
      setColumnVisibility,
      setEnrichedOnly,
      setComparing,
    },
  );

  const openDevice = useCallback((id: string) => {
    setDetailId(id);
    writeDeviceId(id);
  }, []);

  const closeDevice = useCallback(() => {
    setDetailId(null);
    writeDeviceId(null);
  }, []);

  const goCharts = useCallback(() => {
    setView("charts");
    writeHomeView("charts");
  }, []);

  const goTable = useCallback(() => {
    setView("table");
    writeHomeView("table");
  }, []);

  useEffect(() => {
    const sync = () => setToolbarSlot(document.getElementById("ll-home-toolbar-slot"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (view === "charts") return;
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
  }, [view]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const columns = useMemo(
    () => buildDeviceColumns({ selectedIds, toggleSelected, onOpenDevice: openDevice }),
    [selectedIds, toggleSelected, openDevice],
  );

  const prefiltered = useMemo(() => {
    let rows = (data?.devices ?? []).filter((d) => deviceCategory(d.type) === category);
    if (category !== "phone") for (const d of rows) analyzeDeviceLenses(d);
    if (enrichedOnly) rows = rows.filter((d) => meaningfulCameras(d.cameras).length > 0);
    if (comparing) rows = rows.filter((d) => selectedIds.has(d.id));
    return rows;
  }, [data, category, enrichedOnly, comparing, selectedIds]);

  const qualityCounts = useMemo(() => countDataQualityStats(prefiltered), [prefiltered]);

  const compareWins: CompareWins | null = useMemo(() => {
    if (!comparing || selectedIds.size < 2 || !data) return null;
    return computeCompareWins(data.devices.filter((d) => selectedIds.has(d.id)));
  }, [comparing, selectedIds, data]);

  const table = useReactTable({
    data: prefiltered,
    columns,
    state: { sorting, columnFilters, columnVisibility, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    enableMultiSort: true,
    isMultiSortEvent: (e) => (e as MouseEvent).shiftKey,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      return fuzzyMatch(deviceSearchBlob(row.original), String(filterValue));
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row) => row.id,
  });

  const shown = data ? table.getRowModel().rows.length : 0;
  const canCompare = selectedIds.size >= 2;
  const multi = table.getState().sorting.length > 1;
  const selectedDevices = data?.devices.filter((d) => selectedIds.has(d.id)) ?? [];
  const detailDevice = detailId && data ? data.devices.find((d) => d.id === detailId) : undefined;

  const statsText =
    data == null
      ? null
      : comparing
        ? t("table.compareStats")
            .replace("{count}", String(shown))
            .replace("{selected}", String(selectedIds.size))
        : t("table.stats")
            .replace("{shown}", String(shown))
            .replace("{total}", String(prefiltered.length))
            .replace("{complete}", String(qualityCounts.complete))
            .replace("{partial}", String(qualityCounts.partial));

  if (view === "charts") {
    return (
      <ChartsPage
        category={category}
        onBack={goTable}
        onSensorBin={(minMm, maxMm) => {
          setColumnFilters((prev) => [
            ...prev.filter((f) => f.id !== "total_sensor"),
            { id: "total_sensor", value: [minMm, maxMm === 99 ? undefined : maxMm] },
          ]);
          goTable();
        }}
        onYear={(year) => {
          setColumnFilters((prev) => [
            ...prev.filter((f) => f.id !== "release_year"),
            { id: "release_year", value: String(year) },
          ]);
          goTable();
        }}
      />
    );
  }

  return (
    <div className="ll-table-wrap" data-testid="device-table">
      <DeviceTableToolbar
        toolbarSlot={toolbarSlot}
        buyerPreset={buyerPreset}
        setBuyerPreset={setBuyerPreset}
        setSorting={setSorting}
        setColumnFilters={setColumnFilters}
        enrichedOnly={enrichedOnly}
        setEnrichedOnly={setEnrichedOnly}
        comparing={comparing}
        setComparing={setComparing}
        canCompare={canCompare}
        setGlobalFilter={setGlobalFilter}
        setSelectedIds={setSelectedIds}
        category={category}
        onCategory={(cat) => {
          setCategory(cat);
          writeDeviceCategory(cat);
          setColumnVisibility((prev) =>
            cat === "tablet"
              ? { ...prev, ...TABLET_COLUMN_VISIBILITY }
              : { ...prev, cellular: false },
          );
        }}
        onOpenCharts={goCharts}
        table={data ? table : null}
        globalFilter={globalFilter}
        columnsOpen={columnsOpen}
        onColumnsOpen={setColumnsOpen}
        statsText={statsText}
      />
      {error ? (
        <p className="gp-body" role="alert">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p className="gp-body">{t("table.loading")}</p> : null}
      {data ? (
        <>
          <p className="ll-table-hint ll-muted">{t("table.multiSortHint")}</p>
          <CompareBar
            comparing={comparing}
            selected={selectedDevices}
            wins={compareWins}
            similarHints={similarHints}
            onClearSelection={() => {
              setSelectedIds(new Set());
              setComparing(false);
              setSimilarHints([]);
            }}
            onFindSimilar={() => {
              const seed = selectedDevices[0];
              if (!seed) return;
              setSimilarHints(findSimilarDevices(seed, data.devices, 4, 50));
            }}
            onAddSimilar={(id) => {
              setSelectedIds((prev) => new Set(prev).add(id));
              setComparing(true);
              setSimilarHints((prev) => prev.filter((h) => h.id !== id));
            }}
          />
          <DeviceDataGrid
            table={table}
            comparing={comparing}
            compareWins={compareWins}
            selectedIds={selectedIds}
            multi={multi}
          />
          {detailDevice ? <DeviceDetailPanel device={detailDevice} onClose={closeDevice} /> : null}
        </>
      ) : null}
    </div>
  );
}
