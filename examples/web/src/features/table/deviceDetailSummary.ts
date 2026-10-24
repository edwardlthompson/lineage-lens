/**
 * Pure helpers for device detail panel copy.
 */
import type { Device } from "../../types/device";
import { deviceUxScore } from "./deviceUxScore";
import { analyzeDeviceLenses } from "./opticsMath";

export type DetailField = { labelKey: string; value: string; valueKey?: string };

export function detailHeadline(d: Device): string {
  return `${d.vendor} ${d.name}`.trim();
}

/** Stable fields for the detail sheet (label i18n keys + values). */
export function buildDetailFields(d: Device): DetailField[] {
  const optics = analyzeDeviceLenses(d);
  const main = optics.lenses.find((l) => l.type === "main" || l.type === "wide");
  const fields: DetailField[] = [
    { labelKey: "detail.field.codename", value: d.codename },
    { labelKey: "detail.field.status", value: d.lineage_label ?? d.status },
  ];
  if (d.release_year != null) {
    fields.push({ labelKey: "detail.field.year", value: String(d.release_year) });
  }
  if (d.soc) fields.push({ labelKey: "detail.field.soc", value: d.soc });
  if (d.ram) fields.push({ labelKey: "detail.field.ram", value: d.ram });
  fields.push({ labelKey: "detail.field.ux", value: String(deviceUxScore(d)) });
  if (d.scores.camera_score != null) {
    fields.push({ labelKey: "detail.field.cameraScore", value: String(d.scores.camera_score) });
  }
  if (d.scores.worth_buying_score != null) {
    fields.push({ labelKey: "detail.field.worth", value: String(d.scores.worth_buying_score) });
  }
  if (main?.sensorDiagMm != null) {
    fields.push({
      labelKey: "detail.field.mainSensor",
      value: `${main.sensorDiagMm.toFixed(1)} mm`,
    });
  }
  if (d.aggregates.has_ois_main === true) {
    fields.push({ labelKey: "detail.field.ois", value: "OIS" });
  }
  const zoom = d.aggregates.max_optical_zoom;
  if (zoom != null && zoom > 1) {
    fields.push({ labelKey: "detail.field.zoom", value: `${zoom}×` });
  }
  fields.push({
    labelKey: "detail.field.quality",
    valueKey: `table.quality.${d.provenance.quality}`,
    value: d.provenance.quality,
  });
  return fields;
}
