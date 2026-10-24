import type { ColumnFiltersState, SortingState, Table } from "@tanstack/react-table";
import { createPortal } from "react-dom";
import { t } from "../../i18n";
import type { Device } from "../../types/device";
import { applyBuyerPreset, type BuyerPresetId } from "./buyerPresets";
import type { DeviceCategory } from "./deviceCategory";
import { TableSearchChrome } from "./TableSearchChrome";

type Props = {
  toolbarSlot: HTMLElement | null;
  buyerPreset: BuyerPresetId | "";
  setBuyerPreset: (v: BuyerPresetId | "") => void;
  setSorting: (s: SortingState) => void;
  setColumnFilters: (f: ColumnFiltersState) => void;
  enrichedOnly: boolean;
  setEnrichedOnly: (v: boolean) => void;
  comparing: boolean;
  setComparing: (v: boolean) => void;
  canCompare: boolean;
  setGlobalFilter: (v: string) => void;
  setSelectedIds: (v: Set<string>) => void;
  category: DeviceCategory;
  onCategory: (cat: DeviceCategory) => void;
  onOpenCharts: () => void;
  /** Top chrome: search + columns + status (when table is ready). */
  table: Table<Device> | null;
  globalFilter: string;
  columnsOpen: boolean;
  onColumnsOpen: (v: boolean) => void;
  statsText: string | null;
};

export function DeviceTableToolbar(p: Props) {
  if (!p.toolbarSlot) return null;
  return createPortal(
    <>
      <label className="ll-filter-toggle">
        <span className="ll-sr-only">{t("table.cat")}</span>
        <select
          className="ll-col-filter"
          data-testid="device-category"
          aria-label={t("table.cat")}
          value={p.category}
          onChange={(e) => p.onCategory(e.target.value as DeviceCategory)}
        >
          <option value="phone">{t("table.cat.phone")}</option>
          <option value="tablet">{t("table.cat.tablet")}</option>
          <option value="tv">{t("table.cat.tv")}</option>
          <option value="gaming">{t("table.cat.gaming")}</option>
        </select>
      </label>
      <button
        type="button"
        className="ll-clear-filters"
        data-testid="open-charts"
        onClick={p.onOpenCharts}
      >
        {t("charts.open")}
      </button>
      <label className="ll-filter-toggle">
        <span className="ll-sr-only">{t("table.preset")}</span>
        <select
          className="ll-col-filter"
          data-testid="buyer-preset"
          aria-label={t("table.preset")}
          value={p.buyerPreset}
          onChange={(e) => {
            const id = e.target.value as BuyerPresetId | "";
            p.setBuyerPreset(id);
            const pack = applyBuyerPreset(id);
            if (pack) {
              p.setSorting(pack.sorting);
              p.setColumnFilters(pack.columnFilters);
            } else {
              p.setSorting([{ id: "overall_score", desc: true }]);
            }
          }}
        >
          <option value="">{t("table.preset.none")}</option>
          <option value="portrait">{t("table.preset.portrait")}</option>
          <option value="travel">{t("table.preset.travel")}</option>
          <option value="creator">{t("table.preset.creator")}</option>
          <option value="night">{t("table.preset.night")}</option>
        </select>
      </label>
      <label className="ll-filter-toggle">
        <input
          type="checkbox"
          checked={p.enrichedOnly}
          onChange={(e) => p.setEnrichedOnly(e.target.checked)}
          data-testid="enriched-only"
        />
        {t("table.enrichedOnly")}
      </label>
      <button
        type="button"
        className="ll-clear-filters"
        data-testid="compare-btn"
        disabled={!p.canCompare && !p.comparing}
        onClick={() => {
          if (p.comparing) p.setComparing(false);
          else if (p.canCompare) p.setComparing(true);
        }}
      >
        {p.comparing ? t("table.exitCompare") : t("table.compare")}
      </button>
      <button
        type="button"
        className="ll-clear-filters"
        onClick={() => {
          p.setColumnFilters([]);
          p.setGlobalFilter("");
          p.setBuyerPreset("");
          p.setEnrichedOnly(false);
          p.setComparing(false);
          p.setSelectedIds(new Set());
        }}
      >
        {t("table.clearFilters")}
      </button>
      {p.table ? (
        <TableSearchChrome
          table={p.table}
          globalFilter={p.globalFilter}
          onGlobalFilter={p.setGlobalFilter}
          columnsOpen={p.columnsOpen}
          onColumnsOpen={p.onColumnsOpen}
        />
      ) : null}
      {p.statsText ? (
        <p className="ll-table-meta ll-table-meta--header" data-testid="device-stats">
          {p.statsText}
        </p>
      ) : null}
    </>,
    p.toolbarSlot,
  );
}
