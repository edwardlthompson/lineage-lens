import type { Device } from "../../types/device";
import {
  cameraGaps,
  formatCameraGaps,
  formatProVideoBadges,
  mainSensorRank,
  proVideoFlags,
  slowMoCeilingFps,
  uwFovDeg,
  worthBuyingScore,
  zoomReachX,
} from "./buyingSignals";
import { hasHlgVideo, hasLogVideo, mainFlashClass } from "./cameraCapabilities";
import { chargeUxScore, formatChargeLines, parseChargeHints } from "./chargeSignals";
import { audioHints, cameraMaturityScore, usedMarketProxy } from "./marketSignals";

export function MainRankCell({ device }: { device: Device }) {
  const v = mainSensorRank(device);
  return <span>{v == null ? "—" : String(v)}</span>;
}

export function ZoomReachCell({ device }: { device: Device }) {
  const x = zoomReachX(device);
  const uw = uwFovDeg(device);
  const parts: string[] = [];
  if (x != null) parts.push(`×${Number.isInteger(x) ? x : x.toFixed(1)}`);
  if (uw != null) parts.push(`${Math.round(uw)}° UW`);
  return <span>{parts.length ? parts.join(" · ") : "—"}</span>;
}

export function SlowMoCell({ device }: { device: Device }) {
  const fps = slowMoCeilingFps(device);
  return <span>{fps == null ? "—" : `1080@${fps}`}</span>;
}

export function ProVideoCell({ device }: { device: Device }) {
  const badges = formatProVideoBadges(proVideoFlags(device));
  const blob = device.aggregates.video_caps_text ?? "";
  if (hasLogVideo(device.camera_features, blob)) badges.push("Log");
  if (hasHlgVideo(device.camera_features, blob)) badges.push("HLG");
  return badges.length ? (
    <span className="ll-pro-badges">{badges.join(" · ")}</span>
  ) : (
    <span className="ll-muted">—</span>
  );
}

export function FlashClassCell({ device }: { device: Device }) {
  const f = mainFlashClass(device);
  if (f === "unknown" || f === "none") return <span className="ll-muted">—</span>;
  return <span>{f.replace("_", "-")}</span>;
}

export function UsedMarketCell({ device }: { device: Device }) {
  const v = usedMarketProxy(device);
  return <span>{v == null ? "—" : String(v)}</span>;
}

export function BatteryCell({ device }: { device: Device }) {
  const hint = parseChargeHints(device);
  const lines = formatChargeLines(hint);
  const score = chargeUxScore(hint);
  if (!lines.length && score == null) return <span className="ll-muted">—</span>;
  return (
    <ul className="ll-stack">
      {lines.map((line) => (
        <li key={line} className="ll-stack-item">
          {line}
        </li>
      ))}
      {score != null ? <li className="ll-stack-footer">Charge {score}</li> : null}
    </ul>
  );
}

export function AudioCell({ device }: { device: Device }) {
  const hints = audioHints(device).filter((h) => h !== "unknown");
  return hints.length ? <span>{hints.join(" · ")}</span> : <span className="ll-muted">—</span>;
}

export function MaturityCell({ device }: { device: Device }) {
  const v = cameraMaturityScore(device);
  return <span>{v == null ? "—" : String(v)}</span>;
}

export function WorthBuyCell({ device }: { device: Device }) {
  const v = worthBuyingScore(device);
  return <span>{v == null ? "—" : String(Math.round(v))}</span>;
}

export function GapsBadgeCell({ device }: { device: Device }) {
  const text = formatCameraGaps(cameraGaps(device));
  if (!text) return <span className="ll-muted">—</span>;
  return (
    <span className="ll-gaps-badge" title={text}>
      {text}
    </span>
  );
}
