import type { Device } from "../../types/device";
import { cameraTypeLabel, formatOpticalFormat } from "./cameraFormat";
import {
  categoryWin,
  lensWin,
  useCompareHighlight,
} from "./CompareContext";
import {
  analyzeDeviceLenses,
  formatBlur,
  formatFfEq,
  type LensOptics,
} from "./opticsMath";

function Stack({
  items,
  itemWins,
  footer,
  footerWin,
  empty = "—",
}: {
  items: string[];
  itemWins?: boolean[];
  footer?: string | null;
  footerWin?: boolean;
  empty?: string;
}) {
  if (items.length === 0 && !footer) {
    return <span className="ll-muted">{empty}</span>;
  }
  return (
    <ul className="ll-stack">
      {items.map((line, i) => (
        <li
          key={`${i}-${line}`}
          className={itemWins?.[i] ? "ll-stack-item ll-compare-win" : "ll-stack-item"}
        >
          {line}
        </li>
      ))}
      {footer ? (
        <li className={footerWin ? "ll-stack-footer ll-compare-win" : "ll-stack-footer"}>
          {footer}
        </li>
      ) : null}
    </ul>
  );
}

function labeled(L: LensOptics, body: string): string {
  return `${cameraTypeLabel(L.type)}: ${body}`;
}

export function SensorStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, totalSensorDiagMm, totalSensorAreaMm2 } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => {
    const bits: string[] = [];
    if (L.sensorDiagMm != null) bits.push(`${L.sensorDiagMm.toFixed(1)} mm`);
    const opt = formatOpticalFormat(L.opticalFormat ?? undefined);
    if (opt) bits.push(opt);
    return labeled(L, bits.length ? bits.join(" · ") : "—");
  });
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "sensorDiagMm"));
  const footer =
    totalSensorDiagMm > 0
      ? `Σ ${totalSensorDiagMm.toFixed(1)} mm diag · ~${totalSensorAreaMm2.toFixed(0)} mm²`
      : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "totalSensorDiagMm")}
      empty="No sensor sizes"
    />
  );
}

export function PixelPitchStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, overallPixelPitchScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) =>
    labeled(L, L.pixelPitchUm != null ? `${L.pixelPitchUm} µm` : "—"),
  );
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "pixelPitchUm"));
  const footer =
    overallPixelPitchScore != null
      ? `PP score ${overallPixelPitchScore.toFixed(0)}`
      : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "overallPixelPitchScore")}
    />
  );
}

export function FocalStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => labeled(L, formatFfEq(L.focalFfEqMm)));
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "focalFfEqMm"));
  return <Stack items={items} itemWins={itemWins} empty="No focal data" />;
}

export function BlurStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, overallBlurScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => labeled(L, formatBlur(L.blurIndex)));
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "blurIndex"));
  const footer =
    overallBlurScore != null ? `Blur score ${overallBlurScore.toFixed(0)}` : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "overallBlurScore")}
      empty="No blur data"
    />
  );
}

export function SensorNameStackCell({ device }: { device: Device }) {
  const { lenses } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => labeled(L, L.sensorModel?.trim() || "—"));
  return <Stack items={items} empty="No sensor names" />;
}

export function LensScoreStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, overallScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => {
    const score = L.lensScore != null ? L.lensScore.toFixed(0) : "—";
    const vid = L.videoScore != null ? `vid ${L.videoScore.toFixed(0)}` : "vid —";
    return labeled(L, `${score} (${vid})`);
  });
  const itemWins = lenses.map(
    (L) => lensWin(ctx, L.type, "lensScore") || lensWin(ctx, L.type, "videoScore"),
  );
  const footer = overallScore != null ? `Overall ${overallScore.toFixed(0)}` : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "overallScore")}
      empty="—"
    />
  );
}

export function IpRatingCell({ device }: { device: Device }) {
  const ip =
    device.waterproofing?.trim() ||
    extractIpFromPeripherals(device.peripherals) ||
    null;
  return <span>{ip ?? "—"}</span>;
}

function extractIpFromPeripherals(peripherals: string[] | null | undefined): string | null {
  if (!peripherals) return null;
  for (const p of peripherals) {
    const m = String(p).match(/\bIP\d{2}(?:\s*\([^)]+\))?/i);
    if (m) return m[0].replace(/\s+/g, "");
  }
  return null;
}
