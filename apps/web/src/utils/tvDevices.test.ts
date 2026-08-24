import { describe, expect, it } from "vitest";
import { pickSelectedTvId, withoutMockDevices } from "./tvDevices.js";

const mock = {
  id: "mock-iffalcon",
  name: "Mock",
  host: "127.0.0.1",
  connected: false,
  source: "mock" as const,
};

const real = {
  id: "mdns:192.168.1.40:6466",
  name: "Living Room",
  host: "192.168.1.40",
  connected: false,
  source: "mdns" as const,
};

describe("tvDevices", () => {
  it("strips mock TVs in production", () => {
    expect(withoutMockDevices([mock, real], true)).toEqual([real]);
    expect(withoutMockDevices([mock, real], false)).toEqual([mock, real]);
  });

  it("prefers a real TV over the mock device", () => {
    expect(pickSelectedTvId([mock, real], null)).toBe(real.id);
    expect(pickSelectedTvId([mock, real], mock.id)).toBe(mock.id);
  });
});
