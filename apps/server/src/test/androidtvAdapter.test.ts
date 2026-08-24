import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FileCredentialStore } from "../storage/FileCredentialStore.js";
import { AndroidTVAdapter } from "../tv/adapters/AndroidTVAdapter.js";
import { ANDROID_TV_KEY_CODES } from "../tv/androidtv/commands/keyMap.js";
import {
  FAKE_PAIRING_PIN,
  createFakeAndroidTvRemoteFactory,
  type FakeAndroidTvRemote,
} from "../tv/androidtv/protocol/fakeRemote.js";

function waitForPairing(adapter: AndroidTVAdapter): Promise<void> {
  return new Promise((resolve) => {
    adapter.subscribe((event) => {
      if (event.type === "pairingRequired") {
        resolve();
      }
    });
  });
}

async function createAdapter(sessions: FakeAndroidTvRemote[] = []): Promise<{
  adapter: AndroidTVAdapter;
  store: FileCredentialStore;
}> {
  const store = new FileCredentialStore(await mkdtemp(join(tmpdir(), "tv-remote-android-")));
  const adapter = new AndroidTVAdapter({
    credentials: store,
    createRemote: createFakeAndroidTvRemoteFactory(sessions),
    pairingTimeoutMs: 5_000,
  });
  return { adapter, store };
}

describe("AndroidTVAdapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("pairs with a PIN, stores the certificate, and sends HOME", async () => {
    const sessions: FakeAndroidTvRemote[] = [];
    const { adapter, store } = await createAdapter(sessions);
    const pairing = waitForPairing(adapter);
    const connecting = adapter.connect({ host: "192.168.1.40", id: "mdns:192.168.1.40:6466" });

    await pairing;
    await adapter.submitPin(FAKE_PAIRING_PIN);
    const device = await connecting;

    expect(device.connected).toBe(true);
    expect(device.host).toBe("192.168.1.40");
    expect(await store.loadByHost("192.168.1.40")).not.toBeNull();

    await adapter.sendCommand("HOME");
    expect(sessions[0]?.lastKeyCode).toBe(ANDROID_TV_KEY_CODES.HOME);
  });

  it("rejects an invalid PIN and fails pairing", async () => {
    const { adapter } = await createAdapter();
    const pairing = waitForPairing(adapter);
    const connecting = adapter.connect({ host: "192.168.1.40" });

    await pairing;
    await expect(adapter.submitPin("000000")).rejects.toMatchObject({ code: "INVALID_PIN" });
    await expect(connecting).rejects.toMatchObject({ code: "PAIRING_FAILED" });
  });

  it("skips pairing when a certificate is already stored", async () => {
    const sessions: FakeAndroidTvRemote[] = [];
    const { adapter, store } = await createAdapter(sessions);
    await store.save({
      tvId: "manual:192.168.1.40",
      host: "192.168.1.40",
      certPem: "-----BEGIN CERTIFICATE-----\nSAVED\n-----END CERTIFICATE-----\n",
      keyPem: "-----BEGIN PRIVATE KEY-----\nSAVED\n-----END PRIVATE KEY-----\n",
    });

    let pairingRequired = false;
    adapter.subscribe((event) => {
      if (event.type === "pairingRequired") {
        pairingRequired = true;
      }
    });

    const device = await adapter.connect({ host: "192.168.1.40", id: "manual:192.168.1.40" });
    expect(device.connected).toBe(true);
    expect(pairingRequired).toBe(false);
    expect(sessions).toHaveLength(1);
  });

  it("clears stored credentials when the TV unpairs", async () => {
    const sessions: FakeAndroidTvRemote[] = [];
    const { adapter, store } = await createAdapter(sessions);
    await store.save({
      tvId: "mdns:192.168.1.40:6466",
      host: "192.168.1.40",
      certPem: "-----BEGIN CERTIFICATE-----\nSAVED\n-----END CERTIFICATE-----\n",
      keyPem: "-----BEGIN PRIVATE KEY-----\nSAVED\n-----END PRIVATE KEY-----\n",
    });

    const unpaired = new Promise<void>((resolve) => {
      adapter.subscribe((event) => {
        if (event.type === "unpaired") {
          resolve();
        }
      });
    });

    await adapter.connect({ host: "192.168.1.40", id: "mdns:192.168.1.40:6466" });
    sessions[0]?.emit("unpaired");
    await unpaired;

    expect(adapter.isConnected()).toBe(false);
    expect(await store.loadByHost("192.168.1.40")).toBeNull();
  });

  it("reports a focused TV text field from IME inject", async () => {
    const sessions: FakeAndroidTvRemote[] = [];
    const { adapter, store } = await createAdapter(sessions);
    await store.save({
      tvId: "manual:192.168.1.40",
      host: "192.168.1.40",
      certPem: "-----BEGIN CERTIFICATE-----\nSAVED\n-----END CERTIFICATE-----\n",
      keyPem: "-----BEGIN PRIVATE KEY-----\nSAVED\n-----END PRIVATE KEY-----\n",
    });

    const imeEvents: boolean[] = [];
    adapter.subscribe((event) => {
      if (event.type === "ime") {
        imeEvents.push(event.active);
      }
    });

    await adapter.connect({ host: "192.168.1.40", id: "manual:192.168.1.40" });
    sessions[0]?.emitCurrentApp();
    expect(imeEvents).toEqual([true]);

    await adapter.sendCommand("HOME");
    expect(imeEvents).toEqual([true, false]);
  });

  it("does not hang connecting a LAN IP from a cloud host", async () => {
    vi.stubEnv("RENDER", "true");
    const { adapter } = await createAdapter();
    await expect(adapter.connect({ host: "192.168.29.14" })).rejects.toMatchObject({
      code: "CONNECTION_FAILED",
      message: expect.stringContaining("same network"),
    });
  });
});
