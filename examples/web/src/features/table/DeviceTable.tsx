import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import type { Device, DevicesFile } from "../../types/device";
import { loadDevices } from "./loadDevices";

const col = createColumnHelper<Device>();

function fmtNum(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

function fmtBool(v: boolean | null | undefined): string {
  if (v == null) return "—";
  return v ? "Yes" : "No";
}

export function DeviceTable() {
  const [data, setData] = useState<DevicesFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "main_sensor_size", desc: true },
  ]);
  const [query, setQuery] = useState("");

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

  const columns = useMemo(
    () => [
      col.accessor("vendor", { header: "Vendor", sortingFn: "alphanumeric" }),
      col.accessor("name", { header: "Device", sortingFn: "alphanumeric" }),
      col.accessor("codename", { header: "Codename", sortingFn: "alphanumeric" }),
      col.accessor((r) => r.aggregates.main_sensor_size, {
        id: "main_sensor_size",
        header: "Main sensor (mm)",
        cell: (info) => fmtNum(info.getValue()),
        sortingFn: "basic",
      }),
      col.accessor((r) => r.aggregates.main_optical_format, {
        id: "optical_format",
        header: "Optical format",
        cell: (info) => info.getValue() ?? "—",
      }),
      col.accessor((r) => r.aggregates.has_ois_main, {
        id: "has_ois_main",
        header: "OIS",
        cell: (info) => fmtBool(info.getValue()),
      }),
      col.accessor((r) => r.aggregates.max_optical_zoom, {
        id: "max_optical_zoom",
        header: "Max zoom",
        cell: (info) => {
          const v = info.getValue();
          return v == null ? "—" : `${v}×`;
        },
      }),
      col.accessor("status", { header: "Lineage status" }),
      col.accessor((r) => r.provenance.quality, {
        id: "quality",
        header: "Data",
      }),
      col.accessor((r) => r.scores.camera_score, {
        id: "camera_score",
        header: "Camera score",
        cell: (info) => fmtNum(info.getValue(), 1),
      }),
    ],
    [],
  );

  const filtered = useMemo(() => {
    const rows = data?.devices ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) => {
      const hay = [d.vendor, d.name, d.codename, d.soc ?? ""].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [data, query]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
        <p className="gp-body">Loading devices…</p>
      </div>
    );
  }

  return (
    <div className="ll-table-wrap" data-testid="device-table">
      <div className="ll-table-toolbar">
        <label className="ll-search">
          <span className="gp-visually-hidden">Search devices</span>
          <input
            type="search"
            placeholder="Search name, codename, SoC…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="device-search"
          />
        </label>
        <p className="ll-table-meta" data-testid="device-stats">
          Showing {filtered.length} of {data.device_count} · {data.enriched_count} enriched
        </p>
      </div>
      <div className="ll-table-scroll">
        <table className="ll-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
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
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
