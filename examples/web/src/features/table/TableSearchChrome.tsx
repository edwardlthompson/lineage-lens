import type { Table } from "@tanstack/react-table";
import { t } from "../../i18n";
import type { Device } from "../../types/device";
import { TOGGLEABLE_COLUMN_IDS, TOGGLEABLE_I18N } from "./columnVisibility";

type Props = {
  table: Table<Device>;
  globalFilter: string;
  onGlobalFilter: (v: string) => void;
  columnsOpen: boolean;
  onColumnsOpen: (v: boolean) => void;
};

export function TableSearchChrome({
  table,
  globalFilter,
  onGlobalFilter,
  columnsOpen,
  onColumnsOpen,
}: Props) {
  return (
    <div className="ll-table-search-chrome">
      <label className="ll-global-search">
        <span className="ll-sr-only">{t("table.search")}</span>
        <input
          type="search"
          className="ll-col-filter ll-global-search-input"
          placeholder={t("table.searchPlaceholder")}
          value={globalFilter}
          aria-label={t("table.search")}
          data-testid="global-search"
          onChange={(e) => onGlobalFilter(e.target.value)}
        />
      </label>
      <div className="ll-columns-menu">
        <button
          type="button"
          className="ll-clear-filters"
          data-testid="columns-toggle"
          aria-expanded={columnsOpen}
          onClick={() => onColumnsOpen(!columnsOpen)}
        >
          {t("table.columns")}
        </button>
        {columnsOpen ? (
          <fieldset className="ll-columns-panel" data-testid="columns-panel">
            <legend className="ll-sr-only">{t("table.columns")}</legend>
            {TOGGLEABLE_COLUMN_IDS.map((id) => {
              const col = table.getColumn(id);
              if (!col) return null;
              return (
                <label key={id} className="ll-columns-item">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                  />
                  {t(`table.col.${TOGGLEABLE_I18N[id]}`)}
                </label>
              );
            })}
          </fieldset>
        ) : null}
      </div>
    </div>
  );
}
