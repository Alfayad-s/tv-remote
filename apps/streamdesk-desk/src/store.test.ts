import { describe, expect, it } from "vitest";
import { createPairingPin } from "./store.js";

describe("store", () => {
  it("creates a six-digit PIN", () => {
    const pin = createPairingPin();
    expect(pin).toMatch(/^\d{6}$/);
  });
});
