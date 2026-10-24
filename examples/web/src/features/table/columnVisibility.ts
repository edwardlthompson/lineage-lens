import type { VisibilityState } from "@tanstack/react-table";

/** Columns hidden by default to keep the first viewport focused on optics. */
export const DEFAULT_HIDDEN_COLUMNS: VisibilityState = {
  sensor_names: false,
  slowmo: false,
  pro_video: false,
  flash_class: false,
  worth_buy: false,
  gaps: false,
  used_market: false,
  audio: false,
  maturity: false,
  quality: false,
  storage_speed: false,
  refresh_rate: false,
};

/** Toggleable secondary columns (visibility panel). */
export const TOGGLEABLE_COLUMN_IDS = [
  "sensor_names",
  "slowmo",
  "pro_video",
  "stab",
  "flash_class",
  "worth_buy",
  "gaps",
  "used_market",
  "battery",
  "audio",
  "maturity",
  "quality",
  "ux_score",
  "ip_rating",
  "storage_speed",
  "refresh_rate",
] as const;

export type ToggleableColumnId = (typeof TOGGLEABLE_COLUMN_IDS)[number];

/** i18n key suffix after `table.col.` for toggle panel labels. */
export const TOGGLEABLE_I18N: Record<ToggleableColumnId, string> = {
  sensor_names: "sensorName",
  slowmo: "slowmo",
  pro_video: "proVideo",
  stab: "stab",
  flash_class: "flash",
  worth_buy: "worth",
  gaps: "gaps",
  used_market: "used",
  battery: "battery",
  audio: "audio",
  maturity: "maturity",
  quality: "data",
  ux_score: "ux",
  ip_rating: "ip",
  storage_speed: "storage",
  refresh_rate: "refresh",
};
