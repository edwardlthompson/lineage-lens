import { useEffect, useState } from "react";
import { t } from "../../i18n";
import type { DevicesFile } from "../../types/device";
import { type DeviceCategory, deviceCategory } from "../table/deviceCategory";
import { loadDevices } from "../table/loadDevices";
import { analyzeDeviceLenses } from "../table/opticsMath";
import { DeviceCharts } from "./DeviceCharts";

type Props = {
  category: DeviceCategory;
  onBack: () => void;
  onSensorBin: (minMm: number, maxMm: number) => void;
  onYear: (year: number) => void;
};

export function ChartsPage({ category, onBack, onSensorBin, onYear }: Props) {
  const [data, setData] = useState<DevicesFile | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="ll-charts-page" data-testid="charts-page">
      <header className="ll-charts-page-header">
        <h2 className="ll-charts-page-title">
          {t("charts.title")} · {t(`table.cat.${category}`)}
        </h2>
        <button
          type="button"
          className="ll-clear-filters"
          data-testid="charts-back"
          onClick={onBack}
        >
          {t("charts.back")}
        </button>
      </header>
      <p className="ll-muted ll-charts-page-hint">{t("charts.hint")}</p>
      {error ? (
        <p className="gp-body" role="alert">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p className="gp-body">{t("table.loading")}</p> : null}
      {data ? (
        <DeviceCharts
          tall
          devices={data.devices.filter((d) => {
            if (deviceCategory(d.type) !== category) return false;
            analyzeDeviceLenses(d);
            return true;
          })}
          onSensorBin={onSensorBin}
          onYear={onYear}
        />
      ) : null}
    </div>
  );
}
