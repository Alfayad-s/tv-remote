import { describe, expect, it } from "vitest";
import { parseTvTarget } from "../hosts.js";

describe("parseTvTarget", () => {
  it("accepts IPv4 addresses", () => {
    expect(parseTvTarget("192.168.1.40")).toEqual({ host: "192.168.1.40" });
    expect(parseTvTarget(" 10.0.0.8 ")).toEqual({ host: "10.0.0.8" });
  });

  it("accepts an optional remote port", () => {
    expect(parseTvTarget("192.168.1.40:6466")).toEqual({ host: "192.168.1.40", port: 6466 });
  });

  it("accepts hostnames including .local", () => {
    expect(parseTvTarget("living-room.local")).toEqual({ host: "living-room.local" });
    expect(parseTvTarget("localhost")).toEqual({ host: "localhost" });
  });

  it("rejects URLs, junk, and invalid ports", () => {
    expect(parseTvTarget("")).toBeNull();
    expect(parseTvTarget("http://192.168.1.40")).toBeNull();
    expect(parseTvTarget("192.168.1.40:99999")).toBeNull();
    expect(parseTvTarget("not a host")).toBeNull();
    expect(parseTvTarget("999.1.2.3")).toBeNull();
  });
});
