import { t } from "../../i18n";
import { deviceCol } from "./deviceColumnHelper";
import { yearMinFilter } from "./deviceTableFilters";
import { opticsThenPerfSort } from "./deviceTableMeta";
import { analyzeDeviceLenses } from "./opticsMath";
import {
  BitrateStackCell,
  BlurStackCell,
  FocalStackCell,
  LensScoreStackCell,
  PixelPitchStackCell,
  SensorNameStackCell,
  SensorStackCell,
  StabStackCell,
} from "./StackedLensCells";
import { rankOrUndefined, sensorTotalOrUndefined } from "./sortRank";
import { VideoCapsCell } from "./VideoCapsCell";

export function buildOpticsDeviceColumns() {
  const col = deviceCol;
  return [
    col.accessor((r) => sensorTotalOrUndefined(analyzeDeviceLenses(r).totalSensorDiagMm), {
      id: "total_sensor",
      header: () => t("table.col.sensors"),
      cell: ({ row }) => <SensorStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallPixelPitchScore), {
      id: "pp_score",
      header: () => t("table.col.pixelPitch"),
      cell: ({ row }) => <PixelPitchStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
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
    col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallStabScore), {
      id: "stab",
      header: () => t("table.col.stab"),
      cell: ({ row }) => <StabStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallBlurScore), {
      id: "blur_score",
      header: () => t("table.col.blur"),
      cell: ({ row }) => <BlurStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.display({
      id: "sensor_names",
      header: () => t("table.col.sensorName"),
      enableColumnFilter: true,
      filterFn: (row, _id, filterValue: string) => {
        if (!filterValue) return true;
        const q = filterValue.toLowerCase();
        return row.original.cameras.some((c) => (c.sensor_model ?? "").toLowerCase().includes(q));
      },
      cell: ({ row }) => <SensorNameStackCell device={row.original} />,
    }),
    col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallBitrateScore), {
      id: "bitrate",
      header: () => t("table.col.bitrate"),
      cell: ({ row }) => <BitrateStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
    }),
    col.accessor((r) => rankOrUndefined(analyzeDeviceLenses(r).overallScore), {
      id: "overall_score",
      header: () => t("table.col.scores"),
      cell: ({ row }) => <LensScoreStackCell device={row.original} />,
      sortingFn: opticsThenPerfSort,
      sortDescFirst: true,
      sortUndefined: "last",
      filterFn: yearMinFilter,
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
  ];
}
