import type { ReactNode } from "react";
import type { Device } from "../../types/device";
import { categoryWin, lensWin, useCompareHighlight } from "./CompareContext";
import { lensStabLabel } from "./cameraCapabilities";
import { cameraTypeLabel, formatOpticalFormat } from "./cameraFormat";
import { analyzeDeviceLenses, formatBlur, formatFfEq, type LensOptics } from "./opticsMath";
import { valueMatchesSensorCatalog } from "./sensorCatalog";

function Stack({
  items,
  itemWins,
  footer,
  footerWin,
  empty = "—",
  lenses = false,
}: {
  items: ReactNode[];
  itemWins?: boolean[];
  footer?: string | null;
  footerWin?: boolean;
  empty?: string;
  /** Optics lens stacks: zebra + cross-column height sync targets. */
  lenses?: boolean;
}) {
  if (items.length === 0 && !footer) {
    return <span className="ll-muted">{empty}</span>;
  }
  return (
    <ul className={lenses ? "ll-stack ll-stack--lenses" : "ll-stack"}>
      {items.map((line, i) => {
        const classes = ["ll-stack-item"];
        if (lenses && i % 2 === 0) classes.push("ll-lens-zebra");
        if (itemWins?.[i]) classes.push("ll-compare-win");
        return (
          <li key={i} data-lens-index={lenses ? i : undefined} className={classes.join(" ")}>
            {line}
          </li>
        );
      })}
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
    if (L.sensorDiagMm != null) {
      const assumed = valueMatchesSensorCatalog(L.sensorModel, "diag", L.sensorDiagMm);
      bits.push(`${L.sensorDiagMm.toFixed(1)} mm${assumed ? "*" : ""}`);
    }
    const opt = formatOpticalFormat(L.opticalFormat ?? undefined);
    if (opt) {
      const assumed = valueMatchesSensorCatalog(L.sensorModel, "format", L.opticalFormat);
      bits.push(`${opt}${assumed ? "*" : ""}`);
    }
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
      lenses
    />
  );
}

export function PixelPitchStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, overallPixelPitchScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) =>
    labeled(
      L,
      L.pixelPitchUm != null
        ? `${L.pixelPitchUm} µm${valueMatchesSensorCatalog(L.sensorModel, "pitch", L.pixelPitchUm) ? "*" : ""}`
        : "—",
    ),
  );
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "pixelPitchUm"));
  const footer =
    overallPixelPitchScore != null ? `PP score ${overallPixelPitchScore.toFixed(0)}` : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "overallPixelPitchScore")}
      lenses
    />
  );
}

export function FocalStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => labeled(L, formatFfEq(L.focalFfEqMm)));
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "focalFfEqMm"));
  return <Stack items={items} itemWins={itemWins} empty="No focal data" lenses />;
}

export function StabStackCell({ device }: { device: Device }) {
  const { lenses, overallStabScore } = analyzeDeviceLenses(device);
  const deviceEis = device.camera_features?.eis === true;
  const items = lenses.map((L) => labeled(L, lensStabLabel(L.ois, deviceEis)));
  const footer = overallStabScore != null ? `Stab score ${overallStabScore.toFixed(0)}` : null;
  return <Stack items={items} footer={footer} empty="No stab data" lenses />;
}

export function BlurStackCell({ device }: { device: Device }) {
  const ctx = useCompareHighlight();
  const { lenses, overallBlurScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => labeled(L, formatBlur(L.blurIndex)));
  const itemWins = lenses.map((L) => lensWin(ctx, L.type, "blurIndex"));
  const footer = overallBlurScore != null ? `Blur score ${overallBlurScore.toFixed(0)}` : null;
  return (
    <Stack
      items={items}
      itemWins={itemWins}
      footer={footer}
      footerWin={categoryWin(ctx, "overallBlurScore")}
      empty="No blur data"
      lenses
    />
  );
}

export function SensorNameStackCell({ device }: { device: Device }) {
  const { lenses } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => {
    const name = L.sensorModel?.trim() || "—";
    const dcg = L.dcgStatus === "confirmed" ? "DCG" : L.dcgStatus === "sensor_only" ? "DCG?" : null;
    return labeled(L, dcg ? `${name} · ${dcg}` : name);
  });
  return <Stack items={items} empty="No sensor names" lenses />;
}

export function BitrateStackCell({ device }: { device: Device }) {
  const { lenses, overallBitrateScore } = analyzeDeviceLenses(device);
  const items = lenses.map((L) => {
    const mbps =
      L.maxBitrateMbps != null ? `${L.maxBitrateMbps} Mbps${L.bitrateEstimated ? "*" : ""}` : "—";
    return labeled(L, mbps);
  });
  const footer =
    overallBitrateScore != null ? `Bitrate score ${overallBitrateScore.toFixed(0)}` : null;
  return <Stack items={items} footer={footer} empty="No bitrate" lenses />;
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
      lenses
    />
  );
}

export function IpRatingCell({ device }: { device: Device }) {
  const ip = device.waterproofing?.trim() || extractIpFromPeripherals(device.peripherals) || null;
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
