import { describe, expect, it } from "vitest";
import { isPairingPin, normalizePairingPin } from "../pin.js";

describe("pairing PIN", () => {
  it("normalizes hex codes with spaces and dashes", () => {
    expect(normalizePairingPin("ab-cd 12")).toBe("ABCD12");
    expect(normalizePairingPin("ab:cd.12")).toBe("ABCD12");
    expect(isPairingPin("1234")).toBe(true);
    expect(isPairingPin("DEADBEEF")).toBe(true);
  });

  it("rejects codes that are not 4–8 hex characters", () => {
    expect(normalizePairingPin("12")).toBeNull();
    expect(normalizePairingPin("GHIJKL")).toBeNull();
    expect(normalizePairingPin("")).toBeNull();
    expect(isPairingPin("123")).toBe(false);
  });
});
