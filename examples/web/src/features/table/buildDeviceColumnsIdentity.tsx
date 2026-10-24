import { t } from "../../i18n";
import { BatteryCell } from "./BuyingMetaCells";
import { deviceCol } from "./deviceColumnHelper";
import {
  capacityEqualsFilter,
  equalsFilter,
  ipMinFilter,
  yearMinFilter,
} from "./deviceTableFilters";
import { lineageLabel } from "./deviceTableMeta";
import { bestUfs, deviceUxScore, totalRankScore } from "./deviceUxScore";
import { formatGbShort, formatSocOnly, topCapacityGb } from "./hardwareSpec";
import { CodenameModelsCell, ModelAlignedCell } from "./ModelAlignedCells";
import { analyzeDeviceLenses } from "./opticsMath";
import { IpRatingCell } from "./StackedLensCells";
import { rankOrUndefined } from "./sortRank";

export function buildIdentityDeviceColumns({
  selectedIds,
  toggleSelected,
  onOpenDevice,
}: {
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  onOpenDevice?: (id: string) => void;
}) {
  const col = deviceCol;
  return [
    col.display({
      id: "compare",
      header: () => <span className="gp-visually-hidden">{t("table.col.compare")}</span>,
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
    col.accessor(
      (r) => rankOrUndefined(totalRankScore(deviceUxScore(r), analyzeDeviceLenses(r).overallScore)),
      {
        id: "total_rank",
        header: () => t("table.col.total"),
        cell: ({ getValue }) => {
          const v = getValue();
          return v == null ? "—" : String(Math.round(v as number));
        },
        sortingFn: "basic",
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: yearMinFilter,
      },
    ),
    col.accessor("vendor", {
      header: () => t("table.col.vendor"),
      sortingFn: "alphanumeric",
      filterFn: equalsFilter,
    }),
    col.accessor("name", {
      header: () => t("table.col.device"),
      sortingFn: "alphanumeric",
      filterFn: "includesString",
      cell: ({ row }) =>
        onOpenDevice ? (
          <button
            type="button"
            className="ll-device-open"
            onClick={() => onOpenDevice(row.original.id)}
            data-testid={`device-open-${row.original.id}`}
          >
            {row.original.name}
          </button>
        ) : (
          row.original.name
        ),
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
    col.accessor((r) => formatSocOnly(r) ?? "", {
      id: "soc",
      header: () => t("table.col.soc"),
      cell: ({ row }) => {
        const soc = formatSocOnly(row.original);
        return <ModelAlignedCell device={row.original} lines={soc ? [soc] : []} ariaLabel="SoC" />;
      },
      sortingFn: "alphanumeric",
      filterFn: "includesString",
    }),
    col.accessor((r) => rankOrUndefined(topCapacityGb(r.ram)), {
      id: "ram",
      header: () => t("table.col.ram"),
      cell: ({ row }) => {
        const top = formatGbShort(topCapacityGb(row.original.ram));
        return <ModelAlignedCell device={row.original} lines={top ? [top] : []} ariaLabel="RAM" />;
      },
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: capacityEqualsFilter("ram"),
    }),
    col.accessor((r) => rankOrUndefined(bestUfs(r.storage)), {
      id: "storage_speed",
      header: () => t("table.col.storage"),
      cell: ({ row }) => {
        const ufs = bestUfs(row.original.storage);
        return ufs == null ? "—" : `UFS ${ufs}`;
      },
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.accessor(
      (r) => {
        const hz = r.screen?.refresh_rate;
        return rankOrUndefined(typeof hz === "number" ? hz : null);
      },
      {
        id: "refresh_rate",
        header: () => t("table.col.refresh"),
        cell: ({ row }) => {
          const hz = row.original.screen?.refresh_rate;
          return hz == null ? "—" : `${hz} Hz`;
        },
        sortingFn: "basic",
        sortDescFirst: true,
        sortUndefined: "last",
        filterFn: yearMinFilter,
      },
    ),
    col.display({
      id: "battery",
      header: () => t("table.col.battery"),
      cell: ({ row }) => <BatteryCell device={row.original} />,
    }),
    col.accessor((r) => r.waterproofing ?? "", {
      id: "ip_rating",
      header: () => t("table.col.ip"),
      cell: ({ row }) => <IpRatingCell device={row.original} />,
      filterFn: ipMinFilter,
      sortingFn: "alphanumeric",
    }),
    col.accessor((r) => rankOrUndefined(deviceUxScore(r)), {
      id: "ux_score",
      header: () => t("table.col.ux"),
      cell: ({ getValue }) => {
        const v = getValue();
        return v == null ? "—" : String(Math.round(v as number));
      },
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
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
      filterFn: yearMinFilter,
    }),
    col.accessor((r) => lineageLabel(r), {
      id: "status",
      header: () => t("table.col.status"),
      cell: ({ row }) => lineageLabel(row.original),
      filterFn: equalsFilter,
      sortingFn: "alphanumeric",
    }),
  ];
}
