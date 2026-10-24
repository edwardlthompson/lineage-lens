import { useEffect, useMemo, useState } from "react";
import { t } from "../../i18n";
import type { DevicesFile } from "../../types/device";
import { countDataQualityStats } from "../table/dataQualityLabel";
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

  const categoryDevices = useMemo(() => {
    if (!data) return [];
    return data.devices.filter((d) => {
      if (deviceCategory(d.type) !== category) return false;
      analyzeDeviceLenses(d);
      return true;
    });
  }, [data, category]);

  const qualityCounts = useMemo(() => countDataQualityStats(categoryDevices), [categoryDevices]);

  const statsText = data
    ? t("charts.stats")
        .replace("{total}", String(categoryDevices.length))
        .replace("{complete}", String(qualityCounts.complete))
        .replace("{partial}", String(qualityCounts.partial))
    : null;

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
      {statsText ? (
        <p className="ll-muted" data-testid="charts-stats">
          {statsText}
        </p>
      ) : null}
      {error ? (
        <p className="gp-body" role="alert">
          {error}
        </p>
      ) : null}
      {!data && !error ? <p className="gp-body">{t("table.loading")}</p> : null}
      {data ? (
        <DeviceCharts tall devices={categoryDevices} onSensorBin={onSensorBin} onYear={onYear} />
      ) : null}
    </div>
  );
}
