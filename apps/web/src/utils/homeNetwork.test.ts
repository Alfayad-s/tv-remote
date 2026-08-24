import { describe, expect, it } from "vitest";
import { buildHomeRemoteUrl, isPrivateHostname, usesCloudBackend } from "./homeNetwork.js";

describe("isPrivateHostname", () => {
  it("treats loopback and LAN addresses as private", () => {
    expect(isPrivateHostname("localhost")).toBe(true);
    expect(isPrivateHostname("192.168.29.44")).toBe(true);
    expect(isPrivateHostname("10.0.0.8")).toBe(true);
    expect(isPrivateHostname("office.local")).toBe(true);
  });

  it("treats public app hosts as not private", () => {
    expect(isPrivateHostname("iffalcon-remote.vercel.app")).toBe(false);
    expect(isPrivateHostname("8.8.8.8")).toBe(false);
  });
});

describe("usesCloudBackend", () => {
  it("detects hosted Node URLs that cannot reach a home TV", () => {
    expect(usesCloudBackend("wss://tv-remote.onrender.com")).toBe(true);
    expect(usesCloudBackend("wss://remote.example.com/ws")).toBe(false);
    expect(usesCloudBackend("")).toBe(false);
  });
});

describe("buildHomeRemoteUrl", () => {
  it("opens the Vite PWA port by default", () => {
    expect(buildHomeRemoteUrl("192.168.29.44")).toBe("http://192.168.29.44:5173/");
  });

  it("keeps an explicit port", () => {
    expect(buildHomeRemoteUrl("192.168.29.44:5173")).toBe("http://192.168.29.44:5173/");
  });

  it("rejects junk", () => {
    expect(buildHomeRemoteUrl("")).toBeNull();
    expect(buildHomeRemoteUrl("http://192.168.29.44")).toBeNull();
    expect(buildHomeRemoteUrl("999.1.2.3")).toBeNull();
  });
});
