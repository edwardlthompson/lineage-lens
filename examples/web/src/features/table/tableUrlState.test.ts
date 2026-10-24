import { describe, expect, it } from "vitest";
import { parseTableUrl, serializeTableUrl } from "./tableUrlState";

describe("tableUrlState", () => {
  it("round-trips filters and search", () => {
    const qs = serializeTableUrl({
      sorting: [
        { id: "blur_score", desc: true },
        { id: "ux_score", desc: true },
      ],
      columnFilters: [{ id: "vendor", value: "Google" }],
      globalFilter: "pixel",
      columnVisibility: { battery: true },
      enrichedOnly: true,
      comparing: false,
    });
    const parsed = parseTableUrl(`?${qs}`);
    expect(parsed.globalFilter).toBe("pixel");
    expect(parsed.enrichedOnly).toBe(true);
    expect(parsed.sorting?.[0]?.id).toBe("blur_score");
    expect(parsed.columnFilters?.[0]?.value).toBe("Google");
  });

  it("omits default overall_score sort from the URL", () => {
    const qs = serializeTableUrl({
      sorting: [{ id: "overall_score", desc: true }],
      columnFilters: [],
      globalFilter: "",
      columnVisibility: {},
      enrichedOnly: false,
      comparing: false,
    });
    expect(qs).toBe("");
  });

  it("preserves device detail id when serializing", () => {
    const qs = serializeTableUrl(
      {
        sorting: [{ id: "overall_score", desc: true }],
        columnFilters: [],
        globalFilter: "",
        columnVisibility: {},
        enrichedOnly: false,
        comparing: false,
      },
      "google-redfin",
    );
    expect(qs).toBe("device=google-redfin");
  });
});
