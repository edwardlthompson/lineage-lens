/** Screen resolution / size / PPI / panel tech helpers for table + UX. */

export type ScreenLike = Record<string, unknown> | null | undefined;

export type PanelTechClass = "oled" | "lcd" | "other";

/** Flatten nested wiki `{ screen: { … } }` into one field bag. */
export function flattenScreen(screen: ScreenLike): Record<string, unknown> {
  if (!screen || typeof screen !== "object") return {};
  const nested = screen.screen;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...(nested as Record<string, unknown>), ...screen };
  }
  return { ...screen };
}

export function parseResolution(raw: unknown): { w: number; h: number } | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  const m = s.match(/^(\d+)\s*[x×]\s*(\d+)$/);
  if (!m) return null;
  const w = Number(m[1]);
  const h = Number(m[2]);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

export function screenResolution(screen: ScreenLike): { w: number; h: number } | null {
  const flat = flattenScreen(screen);
  return parseResolution(flat.resolution);
}

export function screenSizeInches(screen: ScreenLike): number | null {
  const flat = flattenScreen(screen);
  const raw = flat.size;
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function screenPpi(screen: ScreenLike): number | null {
  const res = screenResolution(screen);
  const size = screenSizeInches(screen);
  if (!res || size == null || size <= 0) return null;
  const diagPx = Math.sqrt(res.w * res.w + res.h * res.h);
  const ppi = diagPx / size;
  if (!Number.isFinite(ppi) || ppi <= 0) return null;
  return Math.round(ppi);
}

export function screenTech(screen: ScreenLike): string | null {
  const flat = flattenScreen(screen);
  const raw = flat.technology ?? flat.tech;
  if (raw == null) return null;
  const s = String(raw).trim();
  return s || null;
}

/** OLED family vs LCD family for UX / sort buckets. */
export function panelTechClass(tech: string | null | undefined): PanelTechClass | null {
  if (!tech) return null;
  const t = tech.toLowerCase();
  if (/oled|amoled|poled|super\s*amoled/.test(t)) return "oled";
  if (/lcd|ips|tft|ltps|pls|igs\s*panel|liquid\s*crystal/.test(t)) return "lcd";
  return "other";
}

export function formatResolution(screen: ScreenLike): string {
  const r = screenResolution(screen);
  return r ? `${r.w}×${r.h}` : "—";
}

export function formatSize(screen: ScreenLike): string {
  const n = screenSizeInches(screen);
  if (n == null) return "—";
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "");
  return `${rounded}"`;
}

export function formatPpi(screen: ScreenLike): string {
  const p = screenPpi(screen);
  return p == null ? "—" : String(p);
}

export function formatTech(screen: ScreenLike): string {
  return screenTech(screen) ?? "—";
}

/** Pixel count for sorting (higher = sharper / more pixels). */
export function resolutionPixelCount(screen: ScreenLike): number | null {
  const r = screenResolution(screen);
  return r ? r.w * r.h : null;
}

/** Sort rank: OLED > other > LCD > missing. */
export function panelTechSortRank(tech: string | null | undefined): number {
  const c = panelTechClass(tech);
  if (c === "oled") return 3;
  if (c === "other") return 2;
  if (c === "lcd") return 1;
  return 0;
}

/** True for TV category (panel TVs, set-tops, HDMI board images). */
export function isTvOrBoxType(type: string | null | undefined): boolean {
  const t = (type ?? "").toLowerCase();
  return t === "tv" || t === "set top box" || t === "devkit" || t.includes("set top");
}

/**
 * Higher max display/HDMI resolution for TV & box UX.
 * 8K → +12, 4K → +8, ≥1440p → +5, 1080p → +2; missing → 0.
 */
export function resolutionUxDelta(screen: ScreenLike): number {
  const res = screenResolution(screen);
  if (!res) return 0;
  const long = Math.max(res.w, res.h);
  const pixels = resolutionPixelCount(screen) ?? 0;
  if (long >= 7680 || pixels >= 7680 * 4320) return 12;
  if (long >= 3840 || pixels >= 3840 * 2160) return 8;
  if (long >= 2560 || pixels >= 2560 * 1440) return 5;
  if (long >= 1920 || pixels >= 1920 * 1080) return 2;
  return 0;
}
