import { describe, expect, it } from "vitest";
import { deviceCategory, parseDeviceCategory } from "./deviceCategory";

describe("deviceCategory", () => {
  it("keeps phones and foldables on the phone chart", () => {
    expect(deviceCategory("phone")).toBe("phone");
    expect(deviceCategory("foldable")).toBe("phone");
    expect(deviceCategory("phone (slider)")).toBe("phone");
  });

  it("splits tablets, TVs, and gaming devices", () => {
    expect(deviceCategory("tablet")).toBe("tablet");
    expect(deviceCategory("tv")).toBe("tv");
    expect(deviceCategory("set top box")).toBe("tv");
    expect(deviceCategory("devkit")).toBe("tv");
    expect(deviceCategory("handheld game console")).toBe("gaming");
  });

  it("reads the category query", () => {
    expect(parseDeviceCategory("?cat=tablet")).toBe("tablet");
    expect(parseDeviceCategory("?cat=nope")).toBe("phone");
  });
});
