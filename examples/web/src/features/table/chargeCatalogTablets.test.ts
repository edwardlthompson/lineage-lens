import { describe, expect, it } from "vitest";
import { lookupCharge } from "./chargeCatalog";
import { CHARGE_CATALOG_TABLETS } from "./chargeCatalogTablets";

describe("chargeCatalogTablets", () => {
  it("covers Tab S7 at published 45W wired, no wireless", () => {
    expect(lookupCharge("gts7l")).toEqual({
      wired: 45,
      wireless: null,
      hasWireless: false,
    });
    expect(lookupCharge("gts7xlwifi")).toEqual({
      wired: 45,
      wireless: null,
      hasWireless: false,
    });
  });

  it("registers every tablet catalog key via lookupCharge", () => {
    for (const cn of Object.keys(CHARGE_CATALOG_TABLETS)) {
      expect(lookupCharge(cn)).not.toBeNull();
    }
  });
});
