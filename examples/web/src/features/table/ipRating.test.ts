import { describe, expect, it } from "vitest";
import { meetsIpMin, parseIpDigits } from "./ipRating";

describe("ipRating", () => {
  it("parses classic and IPX forms", () => {
    expect(parseIpDigits("IP68")).toEqual({ dust: 6, water: 8 });
    expect(parseIpDigits("IP69K")).toEqual({ dust: 6, water: 9 });
    expect(parseIpDigits("IPX8")).toEqual({ dust: null, water: 8 });
    expect(parseIpDigits("None")).toBeNull();
  });

  it("applies IP64+/65+/68+/69+ thresholds", () => {
    expect(meetsIpMin("IP54", 64)).toBe(false);
    expect(meetsIpMin("IP64", 64)).toBe(true);
    expect(meetsIpMin("IP65", 64)).toBe(true);
    expect(meetsIpMin("IP67", 65)).toBe(true);
    expect(meetsIpMin("IP67", 68)).toBe(false);
    expect(meetsIpMin("IP68", 68)).toBe(true);
    expect(meetsIpMin("IP68", 69)).toBe(false);
    expect(meetsIpMin("IP69K", 69)).toBe(true);
    expect(meetsIpMin("IPX8", 68)).toBe(true);
    expect(meetsIpMin("IPX7", 68)).toBe(false);
  });
});
