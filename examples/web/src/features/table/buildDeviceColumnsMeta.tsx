import { t } from "../../i18n";
import {
  AudioCell,
  FlashClassCell,
  GapsBadgeCell,
  MaturityCell,
  ProVideoCell,
  SlowMoCell,
  UsedMarketCell,
  WorthBuyCell,
} from "./BuyingMetaCells";
import { slowMoCeilingFps, worthBuyingScore } from "./buyingSignals";
import { deviceCol } from "./deviceColumnHelper";
import { equalsFilter, yearMinFilter } from "./deviceTableFilters";
import { cameraMaturityScore, usedMarketProxy } from "./marketSignals";
import { rankOrUndefined } from "./sortRank";

export function buildMetaDeviceColumns() {
  const col = deviceCol;
  return [
    col.accessor((r) => rankOrUndefined(slowMoCeilingFps(r)), {
      id: "slowmo",
      header: () => t("table.col.slowmo"),
      cell: ({ row }) => <SlowMoCell device={row.original} />,
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.display({
      id: "pro_video",
      header: () => t("table.col.proVideo"),
      cell: ({ row }) => <ProVideoCell device={row.original} />,
    }),
    col.display({
      id: "flash_class",
      header: () => t("table.col.flash"),
      cell: ({ row }) => <FlashClassCell device={row.original} />,
    }),
    col.accessor((r) => rankOrUndefined(worthBuyingScore(r)), {
      id: "worth_buy",
      header: () => t("table.col.worth"),
      cell: ({ row }) => <WorthBuyCell device={row.original} />,
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.accessor((r) => r.provenance.quality, {
      id: "quality",
      header: () => t("table.col.data"),
      cell: ({ getValue }) => t(`table.quality.${getValue()}`),
      filterFn: equalsFilter,
    }),
    col.display({
      id: "gaps",
      header: () => t("table.col.gaps"),
      cell: ({ row }) => <GapsBadgeCell device={row.original} />,
    }),
    col.accessor((r) => rankOrUndefined(usedMarketProxy(r)), {
      id: "used_market",
      header: () => t("table.col.used"),
      cell: ({ row }) => <UsedMarketCell device={row.original} />,
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.display({
      id: "audio",
      header: () => t("table.col.audio"),
      cell: ({ row }) => <AudioCell device={row.original} />,
    }),
    col.accessor((r) => rankOrUndefined(cameraMaturityScore(r)), {
      id: "maturity",
      header: () => t("table.col.maturity"),
      cell: ({ row }) => <MaturityCell device={row.original} />,
      sortingFn: "basic",
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
  ];
}
