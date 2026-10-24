import { describe, expect, it } from "vitest";
import { yearMinFilter } from "./DeviceTable";

describe("yearMinFilter", () => {
  it("keeps selected year and newer; excludes nulls when filtered", () => {
    const row = (y: number | undefined) => ({ getValue: () => y });
    expect(yearMinFilter(row(2024), "release_year", "")).toBe(true);
    expect(yearMinFilter(row(2024), "release_year", "2023")).toBe(true);
    expect(yearMinFilter(row(2022), "release_year", "2023")).toBe(false);
    expect(yearMinFilter(row(undefined), "release_year", "2023")).toBe(false);
  });
});
