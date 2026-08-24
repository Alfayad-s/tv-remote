import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveWebSocketUrl } from "./websocketUrl.js";

describe("resolveWebSocketUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the page hostname so a phone can reach the LAN service", () => {
    expect(resolveWebSocketUrl()).toMatch(/^ws:\/\/localhost:8787$/);
  });

  it("prefers an explicit environment override", () => {
    vi.stubEnv("VITE_WS_URL", "ws://192.168.1.20:8787");
    expect(resolveWebSocketUrl()).toBe("ws://192.168.1.20:8787");
  });
});
