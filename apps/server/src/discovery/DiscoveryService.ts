import type { TVDevice } from "@tv-remote/shared";

export interface DiscoveryService {
  discover(): Promise<TVDevice[]>;
  stop?(): void;
}
