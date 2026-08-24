import { describe, expect, it, vi } from "vitest";
import { APK_MISSING_MESSAGE, downloadAndroidApk, looksLikeApk } from "./downloadAndroidApk.js";

describe("downloadAndroidApk", () => {
  it("accepts zip/apk bytes and rejects html", async () => {
    const apk = new Blob([new Uint8Array([0x50, 0x4b, 0x03, 0x04]), new Uint8Array(12_000)]);
    const html = new Blob(["<!doctype html><html></html>"], { type: "text/html" });
    expect(await looksLikeApk(apk)).toBe(true);
    expect(await looksLikeApk(html)).toBe(false);
  });

  it("does not save index.html when the server returns a web page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("<!doctype html>", {
            status: 200,
            headers: { "content-type": "text/html" },
          }),
      ),
    );
    const createObjectURL = vi.fn(() => "blob:apk");
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() });

    await expect(downloadAndroidApk()).resolves.toBe(APK_MISSING_MESSAGE);
    expect(createObjectURL).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
