import {
  DEFAULT_REMOTE_PORT,
  type AndroidTvMdnsType,
  type TVBrand,
  type TVDevice,
} from "@tv-remote/shared";

export const BONJOUR_SERVICE_TYPES = ["androidtvremote2", "androidtvremote"] as const;

export interface MdnsServiceRecord {
  name: string;
  host?: string;
  port?: number;
  addresses?: string[];
  fqdn?: string;
  type?: string;
  txt?: Record<string, unknown>;
}

const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

export function inferTvBrand(name: string): TVBrand {
  const normalized = name.toLowerCase();
  if (normalized.includes("iffalcon") || normalized.includes("ifalcon")) {
    return "iFFALCON";
  }
  if (normalized.includes("samsung")) {
    return "SAMSUNG";
  }
  if (normalized.includes("sony")) {
    return "SONY";
  }
  if (/(^|[^a-z])lg([^a-z]|$)/.test(normalized)) {
    return "LG";
  }
  return "ANDROID_TV";
}

export function pickIpv4Address(
  addresses: string[] | undefined,
  fallbackHost?: string,
): string | null {
  const ipv4 = (addresses ?? []).filter((address) => IPV4.test(address));
  const lan = ipv4.find((address) => !address.startsWith("127."));
  if (lan) {
    return lan;
  }
  if (ipv4[0]) {
    return ipv4[0];
  }
  if (fallbackHost && IPV4.test(fallbackHost)) {
    return fallbackHost;
  }
  if (fallbackHost && fallbackHost.length > 0 && !fallbackHost.includes(":")) {
    return fallbackHost.replace(/\.$/, "");
  }
  return null;
}

export function toServiceType(type: string | undefined): AndroidTvMdnsType | undefined {
  if (type === "androidtvremote2" || type === "_androidtvremote2._tcp") {
    return "_androidtvremote2._tcp";
  }
  if (type === "androidtvremote" || type === "_androidtvremote._tcp") {
    return "_androidtvremote._tcp";
  }
  return undefined;
}

function txtName(txt: Record<string, unknown> | undefined): string | undefined {
  if (!txt) {
    return undefined;
  }
  const candidate = txt["fn"] ?? txt["name"] ?? txt["n"];
  return typeof candidate === "string" && candidate.length > 0 ? candidate : undefined;
}

export function toTvDevice(record: MdnsServiceRecord): TVDevice | null {
  const host = pickIpv4Address(record.addresses, record.host);
  if (!host) {
    return null;
  }

  const port = record.port ?? DEFAULT_REMOTE_PORT;
  const name = txtName(record.txt) ?? record.name.replace(/\\./g, ".").trim();
  const serviceType = toServiceType(record.type);

  return {
    id: `mdns:${host}:${String(port)}`,
    name: name.length > 0 ? name : "Android TV",
    host,
    port,
    brand: inferTvBrand(name),
    connected: false,
    source: "mdns",
    ...(serviceType === undefined ? {} : { serviceType }),
  };
}

export function mergeDevices(groups: TVDevice[][]): TVDevice[] {
  const byHost = new Map<string, TVDevice>();
  for (const device of groups.flat()) {
    const key = `${device.host}:${String(device.port ?? DEFAULT_REMOTE_PORT)}`;
    const existing = byHost.get(key);
    if (!existing || (existing.source === "mock" && device.source === "mdns")) {
      byHost.set(key, device);
    }
  }
  return [...byHost.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function withConnectionState(devices: TVDevice[], connected: TVDevice | null): TVDevice[] {
  if (!connected) {
    return devices.map((device) => ({ ...device, connected: false }));
  }
  return devices.map((device) => ({
    ...device,
    connected:
      device.host === connected.host &&
      (device.port ?? DEFAULT_REMOTE_PORT) === (connected.port ?? DEFAULT_REMOTE_PORT),
  }));
}
