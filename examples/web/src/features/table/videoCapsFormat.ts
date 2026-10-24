import type { VideoCapabilities } from "../../types/device";

/** fps keys that are numeric frame rates (ignore HDR flags). */
export function enabledFrameRates(flags: Record<string, boolean | null> | undefined): number[] {
  if (!flags) return [];
  const rates: number[] = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    if (!/^\d+$/.test(key)) continue;
    rates.push(Number(key));
  }
  return rates.sort((a, b) => a - b);
}

export function videoFeatureFlags(flags: Record<string, boolean | null> | undefined): string[] {
  if (!flags) return [];
  const out: string[] = [];
  for (const [key, on] of Object.entries(flags)) {
    if (!on) continue;
    if (/^\d+$/.test(key)) continue;
    out.push(key);
  }
  return out;
}

export function formatFpsList(rates: number[]): string {
  if (rates.length === 0) return "—";
  return rates.map((r) => `${r}`).join("/") + " fps";
}

export function summarizeVideo(video: VideoCapabilities | null | undefined): {
  p1080: string;
  p4k: string;
  p8k: string;
  features: string[];
} {
  if (!video) {
    return { p1080: "—", p4k: "—", p8k: "—", features: [] };
  }
  const f1080 = enabledFrameRates(video["1080p"]);
  const f4k = enabledFrameRates(video["4k"]);
  const f8k = enabledFrameRates(video["8k"]);
  const legacy8k = Boolean(video["4k"]?.["8K"]);
  const features = [
    ...videoFeatureFlags(video["1080p"]),
    ...videoFeatureFlags(video["4k"]).filter((f) => f !== "8K"),
    ...videoFeatureFlags(video["8k"]),
  ];
  return {
    p1080: f1080.length ? `1080p @ ${formatFpsList(f1080)}` : "1080p —",
    p4k: f4k.length ? `4K @ ${formatFpsList(f4k)}` : "4K —",
    p8k: f8k.length ? `8K @ ${formatFpsList(f8k)}` : legacy8k ? "8K" : "—",
    features,
  };
}
