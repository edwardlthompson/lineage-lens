/** Lineage Lens device record — mirrors schemas/device.schema.json */

export type DeviceType =
  | "phone"
  | "tablet"
  | "foldable"
  | "handheld"
  | "stb"
  | "other"
  | string;

export type SupportStatus = "current" | "discontinued" | "experimental" | "unknown";

export type CameraModuleType =
  | "main"
  | "wide"
  | "ultrawide"
  | "telephoto"
  | "macro"
  | "depth"
  | "front"
  | "other";

export type DataQuality = "enriched" | "wiki_only" | "partial";

export interface CameraModule {
  type: CameraModuleType;
  mp?: number | null;
  sensor_model?: string | null;
  optical_format?: string | null;
  sensor_size_mm?: number | null;
  pixel_pitch_um?: number | null;
  focal_length_mm?: number | null;
  aperture?: number | null;
  fov_deg?: number | null;
  ois?: boolean | null;
  flash?: string | null;
  zoom?: number | null;
  info?: string | null;
}

export interface VideoCapabilities {
  "1080p"?: Record<string, boolean | null>;
  "4k"?: Record<string, boolean | null>;
}

export interface DeviceAggregates {
  main_sensor_size?: number | null;
  main_optical_format?: string | null;
  main_pixel_pitch?: number | null;
  has_ois_main?: boolean | null;
  has_telephoto?: boolean | null;
  max_optical_zoom?: number | null;
  camera_module_count?: number | null;
  combined_mp?: number | null;
}

export interface DeviceScores {
  camera_score?: number | null;
  longevity_score?: number | null;
  worth_buying_score?: number | null;
}

export interface DeviceProvenance {
  data_sources: string[];
  quality: DataQuality;
  last_updated: string;
}

export interface Device {
  id: string;
  codename: string;
  variant?: number | null;
  vendor: string;
  name: string;
  models: string[];
  type: DeviceType;
  release_date?: string | null;
  release_year?: number | null;
  image?: string | null;
  versions: string[];
  current_branch?: string | null;
  maintainers: string[];
  first_supported_date?: string | null;
  status: SupportStatus;
  wiki_url?: string | null;
  download_url?: string | null;
  soc?: string | null;
  cpu?: string | null;
  cpu_cores?: string | null;
  cpu_freq?: string | null;
  gpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  screen?: Record<string, unknown> | null;
  battery?: Record<string, unknown> | null;
  dimensions?: Record<string, unknown> | null;
  network?: string[] | null;
  wifi?: string | null;
  bluetooth?: string | null;
  peripherals?: string[] | null;
  architecture?: string | null;
  waterproofing?: string | null;
  cameras: CameraModule[];
  video?: VideoCapabilities | null;
  aggregates: DeviceAggregates;
  scores: DeviceScores;
  provenance: DeviceProvenance;
}

export interface DevicesFile {
  generated_at: string;
  source_wiki_ref?: string | null;
  device_count: number;
  enriched_count: number;
  devices: Device[];
}
