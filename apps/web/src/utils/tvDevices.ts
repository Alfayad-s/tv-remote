import type { TVDevice } from "@tv-remote/shared";

export function withoutMockDevices(devices: TVDevice[], production: boolean): TVDevice[] {
  if (!production) {
    return devices;
  }
  return devices.filter((device) => device.source !== "mock");
}

export function pickSelectedTvId(devices: TVDevice[], current: string | null): string | null {
  if (current && devices.some((device) => device.id === current)) {
    return current;
  }
  const real = devices.find((device) => device.source !== "mock");
  if (real) {
    return real.id;
  }
  return devices[0]?.id ?? null;
}
