import type { TVDevice } from "@tv-remote/shared";
import type { Logger } from "../logger.js";
import type { DiscoveryService } from "./DiscoveryService.js";
import { BONJOUR_SERVICE_TYPES, toTvDevice, type MdnsServiceRecord } from "./deviceModel.js";

export type MdnsBrowse = (
  type: (typeof BONJOUR_SERVICE_TYPES)[number],
  onUp: (record: MdnsServiceRecord) => void,
) => () => void;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timer.unref();
  });
}

export class MdnsDiscoveryService implements DiscoveryService {
  private inflightStop: (() => void) | null = null;

  constructor(
    private readonly options: {
      timeoutMs: number;
      logger: Logger;
      browse: MdnsBrowse;
    },
  ) {}

  stop(): void {
    this.inflightStop?.();
    this.inflightStop = null;
  }

  async discover(): Promise<TVDevice[]> {
    this.stop();
    const found = new Map<string, TVDevice>();
    const stoppers: Array<() => void> = [];

    this.options.logger.debug("Starting mDNS Android TV scan", {
      timeoutMs: this.options.timeoutMs,
      types: BONJOUR_SERVICE_TYPES.join(","),
    });

    this.inflightStop = () => {
      for (const stop of stoppers) {
        try {
          stop();
        } catch {
          // Browsers can throw if multicast is unavailable.
        }
      }
    };

    try {
      for (const type of BONJOUR_SERVICE_TYPES) {
        stoppers.push(
          this.options.browse(type, (record) => {
            const device = toTvDevice({ ...record, type: record.type ?? type });
            if (!device) {
              return;
            }
            found.set(device.id, device);
            this.options.logger.info("Discovered Android TV", {
              name: device.name,
              host: device.host,
              port: device.port,
              serviceType: device.serviceType,
            });
          }),
        );
      }

      await delay(this.options.timeoutMs);
    } catch (error) {
      this.options.logger.warn("mDNS discovery failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      this.stop();
    }

    return [...found.values()];
  }
}
