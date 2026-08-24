import { describe, expect, it } from "vitest";
import { MdnsDiscoveryService, type MdnsBrowse } from "../discovery/MdnsDiscoveryService.js";
import type { Logger } from "../logger.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

describe("MdnsDiscoveryService", () => {
  it("collects Android TV Remote advertisements until the timeout", async () => {
    const browse: MdnsBrowse = (type, onUp) => {
      if (type === "androidtvremote2") {
        onUp({
          name: "iFFALCON Living Room",
          port: 6466,
          addresses: ["192.168.1.40"],
          type,
        });
      }
      return () => undefined;
    };

    const discovery = new MdnsDiscoveryService({
      timeoutMs: 20,
      logger: silentLogger,
      browse,
    });

    const devices = await discovery.discover();
    expect(devices).toEqual([
      {
        id: "mdns:192.168.1.40:6466",
        name: "iFFALCON Living Room",
        host: "192.168.1.40",
        port: 6466,
        brand: "iFFALCON",
        connected: false,
        source: "mdns",
        serviceType: "_androidtvremote2._tcp",
      },
    ]);
  });

  it("returns an empty list when mDNS finds nothing", async () => {
    const discovery = new MdnsDiscoveryService({
      timeoutMs: 10,
      logger: silentLogger,
      browse: () => () => undefined,
    });

    await expect(discovery.discover()).resolves.toEqual([]);
  });
});
