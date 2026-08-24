import type { TVDevice } from "@tv-remote/shared";
import type { DiscoveryService } from "./DiscoveryService.js";
import { mergeDevices } from "./deviceModel.js";

export class CompositeDiscoveryService implements DiscoveryService {
  constructor(private readonly services: DiscoveryService[]) {}

  async discover(): Promise<TVDevice[]> {
    const groups = await Promise.all(
      this.services.map(async (service) => {
        try {
          return await service.discover();
        } catch {
          return [];
        }
      }),
    );
    return mergeDevices(groups);
  }

  stop(): void {
    for (const service of this.services) {
      service.stop?.();
    }
  }
}
