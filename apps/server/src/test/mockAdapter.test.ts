import { describe, expect, it } from "vitest";
import { MockTVAdapter } from "../tv/adapters/MockTVAdapter.js";
import { AppError } from "../types/errors.js";

describe("MockTVAdapter", () => {
  it("connects and reports device state", async () => {
    const adapter = new MockTVAdapter({ latencyMs: 0 });
    expect(adapter.isConnected()).toBe(false);

    const device = await adapter.connect({ host: "192.168.1.40" });

    expect(adapter.isConnected()).toBe(true);
    expect(device.host).toBe("192.168.1.40");
    expect(device.brand).toBe("iFFALCON");
    expect(device.connected).toBe(true);
  });

  it("sends a command only while connected", async () => {
    const adapter = new MockTVAdapter({ latencyMs: 0 });
    await expect(adapter.sendCommand("HOME")).rejects.toBeInstanceOf(AppError);

    await adapter.connect();
    await expect(adapter.sendCommand("HOME")).resolves.toBeUndefined();
  });

  it("disconnects cleanly", async () => {
    const adapter = new MockTVAdapter({ latencyMs: 0 });
    await adapter.connect();
    await adapter.disconnect();
    expect(adapter.isConnected()).toBe(false);
    expect(adapter.getDevice()?.connected).toBe(false);
  });
});
