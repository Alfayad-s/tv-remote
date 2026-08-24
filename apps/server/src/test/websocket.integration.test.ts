import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { loadConfig } from "../config/env.js";
import { MockDiscoveryService } from "../discovery/MockDiscoveryService.js";
import type { Logger } from "../logger.js";
import { MockTVAdapter } from "../tv/adapters/MockTVAdapter.js";
import { TVManager } from "../tv/TVManager.js";
import { createWebSocketServer } from "../websocket/server.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

class TestClient {
  private readonly pending: Array<(message: Record<string, unknown>) => void> = [];
  private readonly queued: Record<string, unknown>[] = [];
  readonly socket: WebSocket;

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as Record<string, unknown>;
      const waiter = this.pending.shift();
      if (waiter) {
        waiter(message);
        return;
      }
      this.queued.push(message);
    });
  }

  open(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.once("open", () => {
        resolve();
      });
      this.socket.once("error", reject);
    });
  }

  next(): Promise<Record<string, unknown>> {
    const queued = this.queued.shift();
    if (queued) {
      return Promise.resolve(queued);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Timed out waiting for WebSocket message"));
      }, 3000);
      this.pending.push((message) => {
        clearTimeout(timer);
        resolve(message);
      });
    });
  }

  async collectUntil(
    predicate: (message: Record<string, unknown>) => boolean,
  ): Promise<Record<string, unknown>[]> {
    const messages: Record<string, unknown>[] = [];
    while (!messages.some(predicate)) {
      messages.push(await this.next());
    }
    return messages;
  }

  send(message: unknown): void {
    this.socket.send(JSON.stringify(message));
  }

  close(): void {
    this.socket.close();
  }
}

describe("WebSocket gateway", () => {
  const config = {
    ...loadConfig({ HOST: "127.0.0.1", PORT: "8787", TV_ADAPTER: "mock", LOG_LEVEL: "error" }),
    port: 0,
    host: "127.0.0.1",
  };
  const tvManager = new TVManager(new MockTVAdapter({ latencyMs: 0 }), silentLogger);
  const wss = createWebSocketServer({
    config,
    logger: silentLogger,
    tvManager,
    discovery: new MockDiscoveryService(),
  });
  let port = 0;

  beforeAll(async () => {
    if (!wss.address()) {
      await new Promise<void>((resolve) => {
        wss.once("listening", () => {
          resolve();
        });
      });
    }
    const address = wss.address();
    if (!address || typeof address === "string") {
      throw new Error("WebSocket server did not bind a TCP port");
    }
    port = address.port;
  });

  afterAll(async () => {
    for (const client of wss.clients) {
      client.terminate();
    }
    await new Promise<void>((resolve) => {
      wss.close(() => {
        resolve();
      });
    });
  });

  it("connects a client through MockTVAdapter and acknowledges HOME", async () => {
    const client = new TestClient(`ws://127.0.0.1:${String(port)}`);
    await client.open();

    const hello = await client.next();
    expect(hello["type"]).toBe("CONNECTION_STATE");

    client.send({ id: "c1", type: "CONNECT_TV", payload: {} });
    const afterConnect = await client.collectUntil((message) => message["type"] === "TV_EVENT");
    expect(afterConnect.some((message) => message["type"] === "CONNECTION_STATE")).toBe(true);

    client.send({ id: "c2", type: "REMOTE_COMMAND", payload: { command: "HOME" } });
    const afterCommand = await client.collectUntil((message) => message["type"] === "COMMAND_ACK");
    expect(afterCommand.some((message) => message["type"] === "TV_EVENT")).toBe(true);

    client.close();
  });
});
