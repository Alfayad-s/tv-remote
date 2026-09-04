import { describe, expect, it } from "vitest";
import { isClientMessage, STREAMDESK_DEFAULT_PORT } from "./index.js";

describe("streamdesk-protocol", () => {
  it("exports the default desk port", () => {
    expect(STREAMDESK_DEFAULT_PORT).toBe(8790);
  });

  it("recognizes client messages", () => {
    expect(isClientMessage({ type: "LIST_APPS", id: "1" })).toBe(true);
    expect(isClientMessage({ type: "NOPE", id: "1" })).toBe(false);
  });
});
