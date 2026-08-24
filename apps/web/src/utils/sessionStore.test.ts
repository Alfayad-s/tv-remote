import { afterEach, describe, expect, it } from "vitest";
import {
  clearSession,
  EMPTY_SESSION,
  parseSession,
  readSession,
  savedTvToDevice,
  shouldRestoreOnReady,
  shouldRestoreOnResume,
  toSavedTv,
  writeSession,
} from "./sessionStore.js";

afterEach(() => {
  clearSession();
});

describe("sessionStore", () => {
  it("round-trips a wanted TV session", () => {
    writeSession({
      wanted: true,
      selectedTvId: "androidtv:192.168.1.40",
      tv: { id: "androidtv:192.168.1.40", host: "192.168.1.40", port: 6466, name: "Living Room" },
    });

    expect(readSession()).toEqual({
      wanted: true,
      selectedTvId: "androidtv:192.168.1.40",
      tv: { id: "androidtv:192.168.1.40", host: "192.168.1.40", port: 6466, name: "Living Room" },
    });
  });

  it("returns an empty session when nothing is stored", () => {
    expect(readSession()).toEqual(EMPTY_SESSION);
  });

  it("ignores corrupt storage", () => {
    expect(parseSession("{not json")).toEqual(EMPTY_SESSION);
  });

  it("restores a wanted session on service ready unless already connected or pairing", () => {
    const tv = { id: "androidtv:1", host: "192.168.1.40" };
    expect(shouldRestoreOnReady(true, tv, "DISCONNECTED")).toBe(true);
    expect(shouldRestoreOnReady(true, tv, "CONNECTING")).toBe(true);
    expect(shouldRestoreOnReady(true, tv, "CONNECTED")).toBe(false);
    expect(shouldRestoreOnReady(true, tv, "PAIRING")).toBe(false);
    expect(shouldRestoreOnReady(false, tv, "DISCONNECTED")).toBe(false);
    expect(shouldRestoreOnReady(true, null, "DISCONNECTED")).toBe(false);
  });

  it("restores on resume only when the session dropped", () => {
    const tv = { id: "androidtv:1", host: "192.168.1.40" };
    expect(shouldRestoreOnResume(true, tv, "DISCONNECTED")).toBe(true);
    expect(shouldRestoreOnResume(true, tv, "ERROR")).toBe(true);
    expect(shouldRestoreOnResume(true, tv, "RECONNECTING")).toBe(true);
    expect(shouldRestoreOnResume(true, tv, "CONNECTING")).toBe(false);
    expect(shouldRestoreOnResume(true, tv, "CONNECTED")).toBe(false);
  });

  it("maps a saved TV onto a device", () => {
    expect(
      savedTvToDevice({ id: "manual:10.0.0.8", host: "10.0.0.8", name: "Bedroom" }),
    ).toMatchObject({
      id: "manual:10.0.0.8",
      host: "10.0.0.8",
      name: "Bedroom",
      source: "manual",
    });
    expect(toSavedTv({ id: "a", host: "1.1.1.1", name: "TV", port: 6466 })).toEqual({
      id: "a",
      host: "1.1.1.1",
      name: "TV",
      port: 6466,
    });
  });
});
