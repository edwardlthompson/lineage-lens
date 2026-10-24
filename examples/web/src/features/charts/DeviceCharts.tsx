import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { t } from "../../i18n";
import type { Device } from "../../types/device";
import { sensorSizeBins, type YearScatterPoint, yearSensorScatter } from "./chartData";

type Props = {
  devices: Device[];
  onSensorBin: (minMm: number, maxMm: number) => void;
  onYear: (year: number) => void;
  /** Taller panels on the dedicated charts page. */
  tall?: boolean;
};

function ScatterTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: YearScatterPoint }>;
}) {
  if (!active || !payload?.[0]?.payload) return null;
  const p = payload[0].payload;
  return (
    <div className="ll-chart-tooltip">
      <strong>{p.name}</strong>
      <div>
        {p.year} · {p.sensorMm.toFixed(1)} mm
      </div>
    </div>
  );
}

export function DeviceCharts({ devices, onSensorBin, onYear, tall = false }: Props) {
  const bins = sensorSizeBins(devices);
  const scatter = yearSensorScatter(devices);
  const height = tall ? 280 : 180;

  return (
    <section
      className={`ll-charts${tall ? " ll-charts--tall" : ""}`}
      aria-label={t("charts.title")}
    >
      <div className="ll-chart-panel">
        <h2 className="ll-chart-title">{t("charts.sensorDist")}</h2>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={bins} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Bar
              dataKey="count"
              fill="var(--gp-color-primary)"
              cursor="pointer"
              onClick={(data) => {
                const p = data as { minMm?: number; maxMm?: number };
                if (p.minMm != null && p.maxMm != null) onSensorBin(p.minMm, p.maxMm);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ll-chart-panel">
        <h2 className="ll-chart-title">{t("charts.yearScatter")}</h2>
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
            <XAxis
              type="number"
              dataKey="year"
              domain={["dataMin - 1", "dataMax + 1"]}
              tick={{ fontSize: 11 }}
              name="Year"
            />
            <YAxis
              type="number"
              dataKey="sensorMm"
              tick={{ fontSize: 11 }}
              width={36}
              name="Sensor mm"
            />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<ScatterTooltip />} />
            <Scatter
              data={scatter}
              fill="var(--gp-color-primary)"
              cursor="pointer"
              onClick={(data) => {
                const p = data as { year?: number };
                if (p.year != null) onYear(p.year);
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
