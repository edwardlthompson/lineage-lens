import { describe, expect, it } from "vitest";
import { deviceSearchBlob, fuzzyMatch } from "./fuzzySearch";

describe("fuzzyMatch", () => {
  it("matches substring and ordered characters", () => {
    expect(fuzzyMatch("Pixel 8 Pro", "")).toBe(true);
    expect(fuzzyMatch("Pixel 8 Pro", "pixel")).toBe(true);
    expect(fuzzyMatch("Pixel 8 Pro", "pxl")).toBe(true);
    expect(fuzzyMatch("Pixel 8 Pro", "xyz")).toBe(false);
  });

  it("builds a searchable device blob", () => {
    const blob = deviceSearchBlob({
      vendor: "Google",
      name: "Pixel 8",
      codename: "shiba",
      models: ["G9BQD"],
      soc: "Tensor G3",
    });
    expect(fuzzyMatch(blob, "shiba")).toBe(true);
    expect(fuzzyMatch(blob, "g9b")).toBe(true);
  });
});
