/**
 * Cross-column lens row height sync helpers (pure).
 */

/** Per lens-index: max of measured heights across stack columns. */
export function maxHeightsByIndex(heightsByColumn: number[][]): number[] {
  let maxLen = 0;
  for (const col of heightsByColumn) {
    if (col.length > maxLen) maxLen = col.length;
  }
  const out: number[] = [];
  for (let i = 0; i < maxLen; i++) {
    let max = 0;
    for (const col of heightsByColumn) {
      const h = col[i];
      if (h != null && h > max) max = h;
    }
    out.push(max);
  }
  return out;
}

/** Apply minHeights to elements grouped by data-lens-index within a table row. */
export function syncLensHeightsInRow(row: HTMLElement): void {
  const items = Array.from(
    row.querySelectorAll<HTMLElement>(".ll-stack--lenses [data-lens-index]"),
  );
  if (!items.length) return;

  // Clear before measure to avoid ratchet growth
  for (const el of items) {
    el.style.minHeight = "";
  }

  const byIndex = new Map<number, HTMLElement[]>();
  for (const el of items) {
    const idx = Number(el.dataset.lensIndex);
    if (!Number.isFinite(idx)) continue;
    const list = byIndex.get(idx) ?? [];
    list.push(el);
    byIndex.set(idx, list);
  }

  for (const [, els] of byIndex) {
    let max = 0;
    for (const el of els) {
      const h = el.getBoundingClientRect().height;
      if (h > max) max = h;
    }
    if (max <= 0) continue;
    const px = `${Math.ceil(max)}px`;
    for (const el of els) {
      el.style.minHeight = px;
    }
  }
}
