import type { ConnectionState } from "./events.js";

export const TV_BRANDS = ["iFFALCON", "ANDROID_TV", "SAMSUNG", "LG", "SONY", "UNKNOWN"] as const;

export type TVBrand = (typeof TV_BRANDS)[number];

export const TV_DEVICE_SOURCES = ["mdns", "manual", "mock"] as const;

export type TVDeviceSource = (typeof TV_DEVICE_SOURCES)[number];

export const ANDROID_TV_MDNS_TYPES = ["_androidtvremote2._tcp", "_androidtvremote._tcp"] as const;

export type AndroidTvMdnsType = (typeof ANDROID_TV_MDNS_TYPES)[number];

export interface TVDevice {
  id: string;
  name: string;
  host: string;
  port?: number;
  brand?: TVBrand;
  model?: string;
  connected: boolean;
  source?: TVDeviceSource;
  serviceType?: AndroidTvMdnsType;
}

export interface ServiceInfo {
  reachable: boolean;
  adapter: "mock" | "androidtv";
}

export interface ConnectionSnapshot {
  service: ServiceInfo;
  state: ConnectionState;
  tv: TVDevice | null;
  lastError: string | null;
}

export const DEFAULT_RECONNECT = {
  initialMs: 1_000,
  maxMs: 30_000,
  maxAttempts: 8,
} as const;

export const DEFAULT_REMOTE_PORT = 6466;
export const DEFAULT_PAIRING_PORT = 6467;
