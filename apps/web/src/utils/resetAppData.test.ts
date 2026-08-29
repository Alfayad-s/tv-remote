import { afterEach, describe, expect, it } from "vitest";
import { EMPTY_SESSION, readSession, writeSession } from "./sessionStore.js";
import { wipeClientData } from "./resetAppData.js";

afterEach(() => {
  window.localStorage?.clear();
});

describe("wipeClientData", () => {
  it("clears the saved TV session and other local data", async () => {
    writeSession({
      wanted: true,
      selectedTvId: "androidtv:1",
      tv: { id: "androidtv:1", host: "192.168.1.40" },
    });
    window.localStorage?.setItem("tv-remote.home-computer", "http://192.168.1.2:5173");

    await wipeClientData();

    expect(readSession()).toEqual(EMPTY_SESSION);
    expect(window.localStorage?.getItem("tv-remote.home-computer")).toBeFalsy();
  });
});
