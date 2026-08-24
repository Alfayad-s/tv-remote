import { describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";

describe("loadConfig", () => {
  it("uses safe development defaults", () => {
    const config = loadConfig({
      HOST: "127.0.0.1",
      PORT: "8787",
      LOG_LEVEL: "debug",
      TV_ADAPTER: "mock",
      WEB_DIST: "false",
    });

    expect(config.host).toBe("127.0.0.1");
    expect(config.port).toBe(8787);
    expect(config.adapter).toBe("mock");
    expect(config.logLevel).toBe("debug");
    expect(config.discoveryMode).toBe("auto");
    expect(config.includeMock).toBe(true);
    expect(config.discoveryTimeoutMs).toBe(3000);
    expect(config.pairingTimeoutMs).toBe(90_000);
    expect(config.pairingClientName).toBe("iFFALCON Remote");
    expect(config.webDist).toBeNull();
  });

  it("falls back when values are unknown", () => {
    const config = loadConfig({
      LOG_LEVEL: "verbose",
      TV_ADAPTER: "samsung",
    });

    expect(config.logLevel).toBe("info");
    expect(config.adapter).toBe("mock");
  });

  it("hides the mock TV in production unless INCLUDE_MOCK is true", () => {
    const production = loadConfig({ NODE_ENV: "production" });
    expect(production.includeMock).toBe(false);
    expect(production.discoveryMode).toBe("mdns");
    expect(production.adapter).toBe("androidtv");

    const forced = loadConfig({ NODE_ENV: "production", INCLUDE_MOCK: "true" });
    expect(forced.includeMock).toBe(true);
  });
});
