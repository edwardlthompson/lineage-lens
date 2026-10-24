import { flexRender, type Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import type { Device } from "../../types/device";
import { CompareProvider } from "./CompareContext";
import type { CompareWins } from "./compareWins";
import { ColumnFilter } from "./deviceTableFilters";
import { bodyCellClass, headerCellClass } from "./deviceTableMeta";
import { LensAlignedRow } from "./LensAlignedRow";
import { syncLensHeightsInRow } from "./lensStackSync";

export function DeviceDataGrid({
  table,
  comparing,
  compareWins,
  selectedIds,
  multi,
}: {
  table: Table<Device>;
  comparing: boolean;
  compareWins: CompareWins | null;
  selectedIds: Set<string>;
  multi: boolean;
}) {
  const rows = table.getRowModel().rows;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const pending = new Set<HTMLTableRowElement>();
    let frame = 0;
    const flush = () => {
      frame = 0;
      for (const row of pending) syncLensHeightsInRow(row);
      pending.clear();
    };
    const schedule = (row: HTMLTableRowElement) => {
      pending.add(row);
      if (!frame) frame = requestAnimationFrame(flush);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) schedule(entry.target as HTMLTableRowElement);
        }
      },
      { root, rootMargin: "240px 0px" },
    );
    for (const row of root.querySelectorAll<HTMLTableRowElement>("tbody tr")) {
      io.observe(row);
    }
    const onResize = () => {
      const view = root.getBoundingClientRect();
      for (const row of root.querySelectorAll<HTMLTableRowElement>("tbody tr")) {
        const box = row.getBoundingClientRect();
        if (box.bottom >= view.top - 240 && box.top <= view.bottom + 240) schedule(row);
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rows]);

  return (
    <div className="ll-table-scroll" data-testid="device-grid" ref={scrollRef}>
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
                          {header.column.getIsSorted() ? (
                            <span className="ll-sort-badge">
                              {header.column.getIsSorted() === "asc" ? " ↑" : " ↓"}
                              {multi ? ` ${header.column.getSortIndex() + 1}` : ""}
                            </span>
                          ) : null}
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
          {rows.map((row) => (
            <CompareProvider
              key={row.id}
              value={{ comparing, deviceId: row.original.id, wins: compareWins }}
            >
              <LensAlignedRow
                className={selectedIds.has(row.original.id) ? "ll-row-selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={bodyCellClass(cell.column.id)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </LensAlignedRow>
            </CompareProvider>
          ))}
        </tbody>
      </table>
    </div>
  );
}
