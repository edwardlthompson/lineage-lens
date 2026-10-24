import { afterEach, describe, expect, it } from "vitest";
import { parseDeviceId, writeDeviceId } from "./deviceDetailUrl";

describe("deviceDetailUrl", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("parses device id from search", () => {
    expect(parseDeviceId("?device=google-pixel5&q=pixel")).toBe("google-pixel5");
    expect(parseDeviceId("sort=x")).toBeNull();
    expect(parseDeviceId("?device=")).toBeNull();
  });

  it("writes and clears device while keeping other params", () => {
    window.history.replaceState(null, "", "/app?q=cam&cam=1");
    writeDeviceId("oneplus-enchilada");
    expect(window.location.search).toContain("device=oneplus-enchilada");
    expect(window.location.search).toContain("q=cam");
    writeDeviceId(null);
    expect(window.location.search).not.toContain("device=");
    expect(window.location.search).toContain("q=cam");
  });
});
