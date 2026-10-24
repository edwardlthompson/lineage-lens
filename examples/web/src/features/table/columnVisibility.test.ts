import { describe, expect, it } from "vitest";
import { DEFAULT_HIDDEN_COLUMNS, TOGGLEABLE_COLUMN_IDS } from "./columnVisibility";

describe("columnVisibility", () => {
  it("hides secondary buying columns by default; stab/battery stay visible", () => {
    expect(DEFAULT_HIDDEN_COLUMNS.battery).toBeUndefined();
    expect(DEFAULT_HIDDEN_COLUMNS.stab).toBeUndefined();
    expect(DEFAULT_HIDDEN_COLUMNS.maturity).toBe(false);
    expect(DEFAULT_HIDDEN_COLUMNS.sensor_names).toBe(false);
    expect(DEFAULT_HIDDEN_COLUMNS.quality).toBe(false);
    expect(TOGGLEABLE_COLUMN_IDS).toContain("sensor_names");
    expect(TOGGLEABLE_COLUMN_IDS).toContain("stab");
    expect(TOGGLEABLE_COLUMN_IDS).toContain("quality");
  });
});
