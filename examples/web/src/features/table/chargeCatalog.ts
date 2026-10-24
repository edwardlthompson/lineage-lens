/**
 * Published charge rates (GSMArena / maker sheets). No estimates.
 * Keyed by Lineage codename. Prefer global, NA, or EU figures when markets
 * differ. Wired watts prefer the international rating when a region is slower.
 * Wireless watts are the phone's maximum published rate.
 * qi is set only when the source names Qi / Qi2.
 */
export type { CatalogCharge } from "./chargeCatalogTypes";

import { CHARGE_CATALOG_LEGACY } from "./chargeCatalogLegacy";
import { CHARGE_CATALOG_MODERN } from "./chargeCatalogModern";
import { CHARGE_CATALOG_TABLETS } from "./chargeCatalogTablets";
import type { CatalogCharge } from "./chargeCatalogTypes";

export const CHARGE_BY_CODENAME: Record<string, CatalogCharge> = {
  ...CHARGE_CATALOG_MODERN,
  ...CHARGE_CATALOG_LEGACY,
  ...CHARGE_CATALOG_TABLETS,
};

export function lookupCharge(codename: string | null | undefined): CatalogCharge | null {
  if (!codename) return null;
  return CHARGE_BY_CODENAME[codename] ?? CHARGE_BY_CODENAME[codename.toLowerCase()] ?? null;
}
