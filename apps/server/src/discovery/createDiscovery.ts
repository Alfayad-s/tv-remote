import Bonjour from "bonjour-service";
import type { Logger } from "../logger.js";
import { CompositeDiscoveryService } from "./CompositeDiscoveryService.js";
import type { DiscoveryService } from "./DiscoveryService.js";
import { MdnsDiscoveryService, type MdnsBrowse } from "./MdnsDiscoveryService.js";
import { MockDiscoveryService } from "./MockDiscoveryService.js";
import type { DiscoveryMode, TvAdapterName } from "../config/env.js";

function createBonjourBrowse(): MdnsBrowse {
  return (type, onUp) => {
    const bonjour = new Bonjour();
    const browser = bonjour.find({ type, protocol: "tcp" }, (service) => {
      onUp({
        name: service.name,
        host: service.host,
        port: service.port,
        fqdn: service.fqdn,
        type: service.type,
        ...(service.addresses === undefined ? {} : { addresses: service.addresses }),
        ...(service.txt === undefined ? {} : { txt: service.txt as Record<string, unknown> }),
      });
    });

    return () => {
      browser.stop();
      bonjour.destroy();
    };
  };
}

export function createDiscoveryService(options: {
  mode: DiscoveryMode;
  adapter: TvAdapterName;
  includeMock: boolean;
  timeoutMs: number;
  logger: Logger;
  browse?: MdnsBrowse;
}): DiscoveryService {
  const mdns = new MdnsDiscoveryService({
    timeoutMs: options.timeoutMs,
    logger: options.logger,
    browse: options.browse ?? createBonjourBrowse(),
  });
  const mock = new MockDiscoveryService();

  if (options.mode === "mock" && options.includeMock) {
    return mock;
  }
  if (options.mode === "mdns" || !options.includeMock) {
    return mdns;
  }
  if (options.adapter === "mock") {
    return new CompositeDiscoveryService([mdns, mock]);
  }
  return mdns;
}
