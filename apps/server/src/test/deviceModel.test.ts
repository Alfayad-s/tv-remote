import { describe, expect, it } from "vitest";
import {
  inferTvBrand,
  mergeDevices,
  pickIpv4Address,
  toTvDevice,
} from "../discovery/deviceModel.js";

describe("inferTvBrand", () => {
  it("detects iFFALCON from the advertised name", () => {
    expect(inferTvBrand("iFFALCON Living Room")).toBe("iFFALCON");
    expect(inferTvBrand("Android TV")).toBe("ANDROID_TV");
  });
});

describe("pickIpv4Address", () => {
  it("prefers a LAN IPv4 over loopback", () => {
    expect(pickIpv4Address(["127.0.0.1", "192.168.1.40"])).toBe("192.168.1.40");
  });

  it("falls back to the hostname when no IPv4 is present", () => {
    expect(pickIpv4Address(["fe80::1"], "living-room.local")).toBe("living-room.local");
  });
});

describe("toTvDevice", () => {
  it("maps an Android TV Remote v2 advertisement", () => {
    expect(
      toTvDevice({
        name: "iFFALCON Living Room",
        host: "Android.local",
        port: 6466,
        addresses: ["192.168.1.40"],
        type: "androidtvremote2",
      }),
    ).toEqual({
      id: "mdns:192.168.1.40:6466",
      name: "iFFALCON Living Room",
      host: "192.168.1.40",
      port: 6466,
      brand: "iFFALCON",
      connected: false,
      source: "mdns",
      serviceType: "_androidtvremote2._tcp",
    });
  });

  it("skips records without a usable address", () => {
    expect(toTvDevice({ name: "TV", addresses: [] })).toBeNull();
  });
});

describe("mergeDevices", () => {
  it("prefers mDNS over a mock device on the same host", () => {
    const merged = mergeDevices([
      [
        {
          id: "mock-iffalcon",
          name: "Mock",
          host: "192.168.1.40",
          port: 6466,
          connected: false,
          source: "mock",
        },
      ],
      [
        {
          id: "mdns:192.168.1.40:6466",
          name: "Living Room",
          host: "192.168.1.40",
          port: 6466,
          connected: false,
          source: "mdns",
        },
      ],
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.source).toBe("mdns");
  });
});
