/** Abbreviate SoC / RAM / storage for a narrow “top spec” column. */

export {
  capacityOptionMatches,
  formatCapacityStack,
  formatGbShort,
  parseCapacityOptionsGb,
  topCapacityGb,
} from "./capacityOptions";

import { formatGbShort, topCapacityGb } from "./capacityOptions";

/** Compact SoC label: SD8G2, SD8+G1, SD8 Elite, SD845, Tensor G3, … */
export function abbreviateSoc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const tensor = s.match(/Tensor\s*(?:G|GS)?\s*(\d+)/i);
  if (tensor) return `Tsr G${tensor[1]}`;

  const eliteGen = s.match(/Snapdragon\s*(\d+)\s*Elite\s*Gen\s*(\d+)/i);
  if (eliteGen) return `SD${eliteGen[1]}E G${eliteGen[2]}`;
  const elite = s.match(/Snapdragon\s*(\d+)\s*Elite\b/i);
  if (elite) return `SD${elite[1]} Elite`;

  const plusGen = s.match(/Snapdragon\s*(\d+)\s*\+\s*Gen\s*(\d+)/i);
  if (plusGen) return `SD${plusGen[1]}+G${plusGen[2]}`;
  const sGen = s.match(/Snapdragon\s*(\d+)s\s*Gen\s*(\d+)/i);
  if (sGen) return `SD${sGen[1]}sG${sGen[2]}`;
  const gen = s.match(/Snapdragon\s*(\d+)\s*Gen\s*(\d+)/i);
  if (gen) return `SD${gen[1]}G${gen[2]}`;

  const g3x = s.match(/Snapdragon\s*(G\d+x)\s*Gen\s*(\d+)/i);
  if (g3x) return `SD ${g3x[1]} G${g3x[2]}`;

  const gPlus = s.match(/Snapdragon\s*(\d{3,4})G\+/i);
  if (gPlus) return `SD${gPlus[1]}G+`;
  const gSuf = s.match(/Snapdragon\s*(\d{3,4})G\b/i);
  if (gSuf) return `SD${gSuf[1]}G`;

  const plusNum = s.match(/Snapdragon\s*(\d{3,4})\+/i);
  if (plusNum) return `SD${plusNum[1]}+`;
  const sdNum = s.match(/Snapdragon\s*(\d{3,4})\b/i);
  if (sdNum) return `SD${sdNum[1]}`;

  const s4 = s.match(/Snapdragon\s*(S\d+(?:\s*(?:Pro|Plus))?)/i);
  if (s4) return `SD ${s4[1].replace(/\s+/g, " ")}`;

  const dimensity = s.match(/Dimensity\s*(\d+)/i);
  if (dimensity) return `D${dimensity[1]}`;

  const helio = s.match(/Helio\s*([A-Z]?\d+)/i);
  if (helio) return `Helio ${helio[1]}`;

  const exynos = s.match(/Exynos\s*(\d+)/i);
  if (exynos) return `Exy${exynos[1]}`;

  const kirin = s.match(/Kirin\s*(\d+)/i);
  if (kirin) return `Kirin${kirin[1]}`;

  const tegra = s.match(/Tegra\s*([A-Z0-9]+)/i);
  if (tegra) return `Tegra ${tegra[1]}`;

  const dragon = s.match(
    /(?:Qualcomm\s+)?(?:Dragonwing\u2122?\s+)?(QC[MS]\d+[A-Z0-9]*|CQ\d+[A-Z0-9]*)/i,
  );
  if (dragon) return dragon[1].toUpperCase();

  const trimmed = s
    .replace(/^Qualcomm\s+/i, "")
    .replace(/Dragonwing\u2122?\s*/gi, "")
    .replace(/^MediaTek\s+/i, "")
    .replace(/^Samsung\s+/i, "")
    .replace(/^Google\s+/i, "")
    .replace(/\s*\([A-Z0-9][A-Z0-9\-]+\)\s*$/i, "")
    .trim();
  return trimmed.length > 18 ? `${trimmed.slice(0, 16)}…` : trimmed;
}

/** One abbreviated line: `SD8G2 · 12GB · 512GB` (top RAM/storage only). */
export function formatTopSpecLine(device: {
  soc?: string | null;
  ram?: string | null;
  storage?: string | null;
}): string | null {
  const parts: string[] = [];
  const soc = abbreviateSoc(device.soc);
  const ram = formatGbShort(topCapacityGb(device.ram));
  const stor = formatGbShort(topCapacityGb(device.storage));
  if (soc) parts.push(soc);
  if (ram) parts.push(ram);
  if (stor) parts.push(stor);
  return parts.length ? parts.join(" · ") : null;
}

/** SoC-only label for the dedicated SoC column. */
export function formatSocOnly(device: { soc?: string | null }): string | null {
  return abbreviateSoc(device.soc);
}
