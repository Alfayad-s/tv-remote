import type { TVDevice } from "@tv-remote/shared";
import type { DiscoveryService } from "./DiscoveryService.js";

export class MockDiscoveryService implements DiscoveryService {
  async discover(): Promise<TVDevice[]> {
    return [
      {
        id: "mock-iffalcon",
        name: "iFFALCON Living Room",
        host: "127.0.0.1",
        port: 6466,
        brand: "iFFALCON",
        model: "Mock Android TV",
        connected: false,
        source: "mock",
      },
    ];
  }
}
