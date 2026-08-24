import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { loadConfig } from "../config/env.js";
import { MockDiscoveryService } from "../discovery/MockDiscoveryService.js";
import type { Logger } from "../logger.js";
import { MockTVAdapter } from "../tv/adapters/MockTVAdapter.js";
import { TVManager } from "../tv/TVManager.js";
import { createGateway } from "../websocket/server.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

describe("HTTP gateway", () => {
  const webDist = mkdtempSync(join(tmpdir(), "tv-remote-web-"));
  writeFileSync(join(webDist, "index.html"), "<html><body>remote</body></html>");
  writeFileSync(join(webDist, "app.js"), "console.log('ok')");
  mkdirSync(join(webDist, "downloads"));
  writeFileSync(join(webDist, "downloads", "iffalcon-remote.apk"), "apk-bytes");

  const config = {
    ...loadConfig({
      HOST: "127.0.0.1",
      PORT: "8787",
      TV_ADAPTER: "mock",
      LOG_LEVEL: "error",
      WEB_DIST: webDist,
    }),
    port: 0,
    host: "127.0.0.1" as const,
    webDist,
  };
  const gateway = createGateway({
    config,
    logger: silentLogger,
    tvManager: new TVManager(new MockTVAdapter({ latencyMs: 0 }), silentLogger),
    discovery: new MockDiscoveryService(),
  });
  let origin = "";

  beforeAll(async () => {
    if (!gateway.httpServer.listening) {
      await new Promise<void>((resolve) => {
        gateway.httpServer.once("listening", () => {
          resolve();
        });
      });
    }
    const address = gateway.httpServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Gateway did not bind a TCP port");
    }
    origin = `http://127.0.0.1:${String(address.port)}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      gateway.httpServer.close(() => {
        resolve();
      });
    });
  });

  it("reports health for a tunnel or reverse proxy", async () => {
    const response = await fetch(`${origin}/health`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; runtime: string };
    expect(body.ok).toBe(true);
    expect(body.runtime).toBe("home");
  });

  it("serves the PWA from the same port as the WebSocket", async () => {
    const page = await fetch(`${origin}/`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("remote");

    const script = await fetch(`${origin}/app.js`);
    expect(script.status).toBe(200);
    expect(await script.text()).toContain("console.log");
  });

  it("serves the Android app download", async () => {
    const response = await fetch(`${origin}/downloads/iffalcon-remote.apk`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("android.package-archive");
    expect(response.headers.get("content-disposition")).toContain("iffalcon-remote.apk");
    expect(await response.text()).toBe("apk-bytes");
  });
});
