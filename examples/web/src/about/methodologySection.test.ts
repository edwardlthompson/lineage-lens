import { describe, expect, it } from "vitest";
import { createMethodologySection } from "./methodologySection";

describe("createMethodologySection", () => {
  it("renders methodology with product keywords", () => {
    const el = createMethodologySection();
    const text = el.textContent ?? "";
    expect(el.dataset.testid).toBe("about-methodology");
    for (const kw of [
      "lineageos",
      "camera",
      "sensor",
      "ois",
      "comparison",
      "static-site",
      "github-pages",
    ]) {
      expect(text.toLowerCase()).toContain(kw);
    }
  });
});
