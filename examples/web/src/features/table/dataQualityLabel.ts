import type { DataQuality } from "../../types/device";

/** i18n key for a Data-column quality tier. */
export function dataQualityLabelKey(quality: DataQuality): string {
  return `table.quality.${quality}`;
}

export type QualityCounts = Record<DataQuality, number>;

export function countDataQuality(
  devices: { provenance: { quality: DataQuality } }[],
): QualityCounts {
  const out: QualityCounts = {
    complete: 0,
    enriched: 0,
    partial: 0,
    wiki_only: 0,
  };
  for (const d of devices) {
    const q = d.provenance.quality;
    if (q in out) out[q] += 1;
  }
  return out;
}

/** Stats-line buckets: enriched→complete, wiki_only→partial. */
export function countDataQualityStats(devices: { provenance: { quality: DataQuality } }[]): {
  complete: number;
  partial: number;
} {
  const c = countDataQuality(devices);
  return {
    complete: c.complete + c.enriched,
    partial: c.partial + c.wiki_only,
  };
}
