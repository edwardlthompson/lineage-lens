/** Charge catalog entry shape. */
export type CatalogCharge = {
  wired: number | null;
  wireless: number | null;
  /** false = maker spec lists no wireless charging. */
  hasWireless: boolean;
  qi?: "Qi1" | "Qi2";
};
