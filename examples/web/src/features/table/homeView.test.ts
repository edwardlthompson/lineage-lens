import { afterEach, describe, expect, it } from "vitest";
import { parseHomeView, writeHomeView } from "./homeView";

describe("homeView", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("parses charts view", () => {
    expect(parseHomeView("?view=charts")).toBe("charts");
    expect(parseHomeView("?q=x")).toBe("table");
  });

  it("writes charts view while keeping other params", () => {
    window.history.replaceState(null, "", "/?q=pixel");
    writeHomeView("charts");
    expect(window.location.search).toContain("view=charts");
    expect(window.location.search).toContain("q=pixel");
    writeHomeView("table");
    expect(window.location.search).not.toContain("view=");
    expect(window.location.search).toContain("q=pixel");
  });
});
