import { describe, expect, it } from "vitest";
import { cloudLanConnectError, isCloudRuntime, isPrivateIpv4 } from "./lan.js";

describe("lan helpers", () => {
  it("detects private IPv4 addresses", () => {
    expect(isPrivateIpv4("192.168.29.14")).toBe(true);
    expect(isPrivateIpv4("10.0.0.5")).toBe(true);
    expect(isPrivateIpv4("172.16.1.1")).toBe(true);
    expect(isPrivateIpv4("8.8.8.8")).toBe(false);
    expect(isPrivateIpv4("living-room.local")).toBe(false);
  });

  it("detects common cloud runtimes", () => {
    expect(isCloudRuntime({})).toBe(false);
    expect(isCloudRuntime({ RENDER: "true" })).toBe(true);
    expect(isCloudRuntime({ TV_REMOTE_CLOUD: "true" })).toBe(true);
  });

  it("explains why a cloud host cannot pair a LAN TV", () => {
    const error = cloudLanConnectError("192.168.29.14");
    expect(error.code).toBe("CONNECTION_FAILED");
    expect(error.message).toContain("192.168.29.14");
    expect(error.message).toContain("same network");
  });
});
