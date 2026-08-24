import { mkdtemp, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileCredentialStore } from "../storage/FileCredentialStore.js";

const SAMPLE = {
  tvId: "mdns:192.168.1.40:6466",
  host: "192.168.1.40",
  certPem: "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----\n",
  keyPem: "-----BEGIN PRIVATE KEY-----\nTEST\n-----END PRIVATE KEY-----\n",
};

describe("FileCredentialStore", () => {
  it("saves, loads by id and host, and uses hashed filenames", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tv-remote-creds-"));
    const store = new FileCredentialStore(dir);

    await store.save(SAMPLE);

    expect(await store.load(SAMPLE.tvId)).toEqual(SAMPLE);
    expect(await store.loadByHost(SAMPLE.host)).toEqual(SAMPLE);

    const names = await readdir(dir);
    expect(names.some((name) => name.includes("192.168"))).toBe(false);
    expect(names.every((name) => name.endsWith(".json"))).toBe(true);

    await store.clear(SAMPLE.tvId);
    expect(await store.load(SAMPLE.tvId)).toBeNull();
  });

  it("restores credentials by host when the TV id changes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tv-remote-creds-"));
    const store = new FileCredentialStore(dir);
    await store.save(SAMPLE);

    expect(await store.load("manual:192.168.1.40")).toBeNull();
    expect(await store.loadByHost("192.168.1.40")).toEqual(SAMPLE);
  });

  it("clears every record for a host", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tv-remote-creds-"));
    const store = new FileCredentialStore(dir);
    await store.save(SAMPLE);
    await store.save({ ...SAMPLE, tvId: "manual:192.168.1.40" });

    await store.clearByHost(SAMPLE.host);
    expect(await store.load(SAMPLE.tvId)).toBeNull();
    expect(await store.loadByHost(SAMPLE.host)).toBeNull();
  });
});
