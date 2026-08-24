import { describe, expect, it } from "vitest";
import { isNativeAndroid } from "./platform.js";

describe("isNativeAndroid", () => {
  it("is false in the browser test environment", () => {
    expect(isNativeAndroid()).toBe(false);
  });
});
