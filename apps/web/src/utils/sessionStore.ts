import type { ConnectionState, TVDevice } from "@tv-remote/shared";
import { DEFAULT_REMOTE_PORT } from "@tv-remote/shared";

const STORAGE_KEY = "tv-remote.session.v1";
const memoryStore = new Map<string, string>();

export interface SavedTv {
  id: string;
  host: string;
  port?: number;
  name?: string;
}

export interface SavedSession {
  wanted: boolean;
  tv: SavedTv | null;
  selectedTvId: string | null;
}

export const EMPTY_SESSION: SavedSession = {
  wanted: false,
  tv: null,
  selectedTvId: null,
};

function isSavedTv(value: unknown): value is SavedTv {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const tv = value as Partial<SavedTv>;
  return (
    typeof tv.id === "string" &&
    tv.id.length > 0 &&
    typeof tv.host === "string" &&
    tv.host.length > 0
  );
}

function storageGet(key: string): string | null {
  try {
    const value = window.localStorage?.getItem(key);
    if (typeof value === "string") {
      return value;
    }
  } catch {
    // Private mode / missing storage.
  }
  return memoryStore.get(key) ?? null;
}

function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function storageRemove(key: string): void {
  memoryStore.delete(key);
  try {
    window.localStorage?.removeItem(key);
  } catch {
    // Ignore missing storage.
  }
}

export function parseSession(raw: string): SavedSession {
  try {
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    const tv = isSavedTv(parsed.tv) ? parsed.tv : null;
    return {
      wanted: parsed.wanted === true,
      tv,
      selectedTvId:
        typeof parsed.selectedTvId === "string" ? parsed.selectedTvId : (tv?.id ?? null),
    };
  } catch {
    return EMPTY_SESSION;
  }
}

export function readSession(): SavedSession {
  const raw = storageGet(STORAGE_KEY);
  if (!raw) {
    return EMPTY_SESSION;
  }
  return parseSession(raw);
}

export function writeSession(session: SavedSession): void {
  storageSet(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  storageRemove(STORAGE_KEY);
}

export function toSavedTv(tv: { id: string; host: string; port?: number; name?: string }): SavedTv {
  return {
    id: tv.id,
    host: tv.host,
    ...(tv.name === undefined ? {} : { name: tv.name }),
    ...(tv.port === undefined ? {} : { port: tv.port }),
  };
}

export function savedTvToDevice(tv: SavedTv): TVDevice {
  return {
    id: tv.id,
    name: tv.name ?? "iFFALCON TV",
    host: tv.host,
    port: tv.port ?? DEFAULT_REMOTE_PORT,
    brand: "iFFALCON",
    connected: false,
    source: tv.id.startsWith("manual:") ? "manual" : "mdns",
  };
}

export function shouldRestoreOnReady(
  wanted: boolean,
  tv: SavedTv | null,
  state: ConnectionState,
): boolean {
  return wanted && tv !== null && state !== "CONNECTED" && state !== "PAIRING";
}

export function shouldRestoreOnResume(
  wanted: boolean,
  tv: SavedTv | null,
  state: ConnectionState,
): boolean {
  return (
    wanted &&
    tv !== null &&
    (state === "DISCONNECTED" || state === "ERROR" || state === "RECONNECTING")
  );
}
