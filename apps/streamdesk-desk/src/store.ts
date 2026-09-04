import { randomBytes, randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface PairedDevice {
  token: string;
  deviceName: string;
  pairedAt: string;
}

interface DeskStoreFile {
  devices: PairedDevice[];
}

function storePath(): string {
  return join(homedir(), ".streamdesk", "paired.json");
}

function readStore(): DeskStoreFile {
  const path = storePath();
  if (!existsSync(path)) {
    return { devices: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as DeskStoreFile;
    return { devices: Array.isArray(raw.devices) ? raw.devices : [] };
  } catch {
    return { devices: [] };
  }
}

function writeStore(store: DeskStoreFile): void {
  const dir = join(homedir(), ".streamdesk");
  mkdirSync(dir, { recursive: true });
  writeFileSync(storePath(), JSON.stringify(store, null, 2), "utf8");
}

export function createPairingPin(): string {
  return String(randomInt(100000, 999999));
}

export function createDeviceToken(): string {
  return randomBytes(24).toString("hex");
}

export function listPairedDevices(): PairedDevice[] {
  return readStore().devices;
}

export function pairDevice(deviceName: string): PairedDevice {
  const store = readStore();
  const device: PairedDevice = {
    token: createDeviceToken(),
    deviceName: deviceName.trim() || "Phone",
    pairedAt: new Date().toISOString(),
  };
  store.devices.push(device);
  writeStore(store);
  return device;
}

export function findDevice(token: string): PairedDevice | null {
  return readStore().devices.find((device) => device.token === token) ?? null;
}

export function revokeAllDevices(): void {
  writeStore({ devices: [] });
}
