import type { ColumnFiltersState, SortingState, VisibilityState } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import { DEFAULT_HIDDEN_COLUMNS } from "./columnVisibility";
import { parseTableUrl, writeTableUrl } from "./tableUrlState";

type Setters = {
  setSorting: (s: SortingState) => void;
  setColumnFilters: (f: ColumnFiltersState) => void;
  setGlobalFilter: (v: string) => void;
  setColumnVisibility: (v: VisibilityState) => void;
  setEnrichedOnly: (v: boolean) => void;
  setComparing: (v: boolean) => void;
};

/** Hydrate once from URL; then mirror table state into the query string. */
export function useTableUrlSync(
  state: {
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
    columnVisibility: VisibilityState;
    enrichedOnly: boolean;
    comparing: boolean;
  },
  setters: Setters,
): void {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current || typeof window === "undefined") return;
    hydrated.current = true;
    const parsed = parseTableUrl(window.location.search);
    if (parsed.sorting) setters.setSorting(parsed.sorting);
    if (parsed.columnFilters) setters.setColumnFilters(parsed.columnFilters);
    if (parsed.globalFilter != null) setters.setGlobalFilter(parsed.globalFilter);
    if (parsed.columnVisibility) {
      setters.setColumnVisibility({ ...DEFAULT_HIDDEN_COLUMNS, ...parsed.columnVisibility });
    }
    if (parsed.enrichedOnly != null) setters.setEnrichedOnly(parsed.enrichedOnly);
    if (parsed.comparing != null) setters.setComparing(parsed.comparing);
    // setters are stable useState dispatchers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    writeTableUrl(state);
  }, [state]);
}
