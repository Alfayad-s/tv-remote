import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ServerMessage } from "@tv-remote/shared";
import type { Logger } from "../logger.js";
import { FileCredentialStore } from "../storage/FileCredentialStore.js";
import { MockTVAdapter } from "../tv/adapters/MockTVAdapter.js";
import { SwitchingTVAdapter } from "../tv/adapters/SwitchingTVAdapter.js";
import { AndroidTVAdapter } from "../tv/adapters/AndroidTVAdapter.js";
import {
  FAKE_PAIRING_PIN,
  createFakeAndroidTvRemoteFactory,
} from "../tv/androidtv/protocol/fakeRemote.js";
import { TVManager } from "../tv/TVManager.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

async function switchingManager(): Promise<TVManager> {
  const store = new FileCredentialStore(await mkdtemp(join(tmpdir(), "tv-remote-switch-")));
  const adapter = new SwitchingTVAdapter({
    mock: new MockTVAdapter({ latencyMs: 0 }),
    androidtv: new AndroidTVAdapter({
      credentials: store,
      createRemote: createFakeAndroidTvRemoteFactory(),
      pairingTimeoutMs: 5_000,
    }),
  });
  return new TVManager(adapter, silentLogger);
}

describe("TVManager", () => {
  it("broadcasts connection state and TV events", async () => {
    const manager = new TVManager(new MockTVAdapter({ latencyMs: 0 }), silentLogger);
    const messages: ServerMessage[] = [];
    manager.subscribe((message) => {
      messages.push(message);
    });

    await manager.connect();

    expect(manager.getState()).toBe("CONNECTED");
    expect(messages.some((message) => message.type === "CONNECTION_STATE")).toBe(true);
    expect(messages.some((message) => message.type === "TV_EVENT")).toBe(true);
  });

  it("requires a connection before sending commands", async () => {
    const manager = new TVManager(new MockTVAdapter({ latencyMs: 0 }), silentLogger);
    await expect(manager.sendCommand("HOME")).rejects.toMatchObject({ code: "CONNECTION_FAILED" });
  });

  it("keeps loopback connections on the mock adapter", async () => {
    const manager = await switchingManager();
    const device = await manager.connect({ host: "127.0.0.1", id: "mock-iffalcon" });
    expect(manager.getState()).toBe("CONNECTED");
    expect(device.host).toBe("127.0.0.1");
    expect(manager.getAdapterName()).toBe("mock");
  });

  it("pairs a LAN TV instead of pretending the mock adapter connected", async () => {
    const manager = await switchingManager();
    const messages: ServerMessage[] = [];
    manager.subscribe((message) => {
      messages.push(message);
    });

    const connecting = manager.connect({ host: "192.168.1.40", id: "manual:192.168.1.40" });
    await expect.poll(() => manager.getState()).toBe("PAIRING");
    expect(
      messages.some(
        (message) => message.type === "TV_EVENT" && message.payload.event === "PAIRING",
      ),
    ).toBe(true);

    await manager.submitPin(FAKE_PAIRING_PIN);
    await connecting;

    expect(manager.getState()).toBe("CONNECTED");
    expect(manager.getAdapterName()).toBe("androidtv");
    expect(
      messages.some((message) => message.type === "TV_EVENT" && message.payload.event === "PAIRED"),
    ).toBe(true);
  });
});
