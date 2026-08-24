import { describe, expect, it } from "vitest";
import { createDiscoveryService } from "./createDiscovery.js";
import type { Logger } from "../logger.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

describe("createDiscoveryService", () => {
  it("does not advertise the mock TV when includeMock is false", async () => {
    const discovery = createDiscoveryService({
      mode: "auto",
      adapter: "mock",
      includeMock: false,
      timeoutMs: 10,
      logger: silentLogger,
      browse: () => () => undefined,
    });

    await expect(discovery.discover()).resolves.toEqual([]);
  });

  it("includes the mock TV in development auto mode", async () => {
    const discovery = createDiscoveryService({
      mode: "auto",
      adapter: "mock",
      includeMock: true,
      timeoutMs: 10,
      logger: silentLogger,
      browse: () => () => undefined,
    });

    const devices = await discovery.discover();
    expect(devices.some((device) => device.source === "mock")).toBe(true);
  });
});
