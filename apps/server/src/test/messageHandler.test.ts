import { describe, expect, it } from "vitest";
import { MockDiscoveryService } from "../discovery/MockDiscoveryService.js";
import type { Logger } from "../logger.js";
import { MockTVAdapter } from "../tv/adapters/MockTVAdapter.js";
import { TVManager } from "../tv/TVManager.js";
import { handleClientMessage } from "../websocket/messageHandler.js";

const silentLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

function deps() {
  return {
    tvManager: new TVManager(new MockTVAdapter({ latencyMs: 0 }), silentLogger),
    discovery: new MockDiscoveryService(),
    logger: silentLogger,
  };
}

describe("handleClientMessage", () => {
  it("rejects unknown commands", async () => {
    const replies = await handleClientMessage(
      {
        id: "1",
        type: "REMOTE_COMMAND",
        payload: { command: "EXPLODE" },
      },
      deps(),
    );

    expect(replies[0]).toMatchObject({
      type: "ERROR",
      payload: { code: "UNKNOWN_COMMAND" },
    });
  });

  it("connects through the mock adapter and acknowledges HOME", async () => {
    const handlerDeps = deps();

    await handleClientMessage({ id: "c1", type: "CONNECT_TV", payload: {} }, handlerDeps);
    const replies = await handleClientMessage(
      { id: "c2", type: "REMOTE_COMMAND", payload: { command: "HOME" } },
      handlerDeps,
    );

    expect(handlerDeps.tvManager.getState()).toBe("CONNECTED");
    expect(replies).toEqual([
      {
        id: "c2",
        type: "COMMAND_ACK",
        payload: { command: "HOME", success: true },
      },
    ]);
  });

  it("answers ping with pong", async () => {
    const replies = await handleClientMessage(
      { id: "p1", type: "PING", payload: { timestamp: 123 } },
      deps(),
    );
    expect(replies[0]).toEqual({ id: "p1", type: "PONG", payload: { timestamp: 123 } });
  });

  it("returns discovered TVs", async () => {
    const replies = await handleClientMessage(
      { id: "d1", type: "DISCOVER_TVS", payload: {} },
      deps(),
    );
    expect(replies[0]).toMatchObject({
      type: "TV_LIST",
      payload: {
        devices: [
          {
            id: "mock-iffalcon",
            name: "iFFALCON Living Room",
            host: "127.0.0.1",
            source: "mock",
          },
        ],
      },
    });
  });

  it("rejects an invalid connect host", async () => {
    const replies = await handleClientMessage(
      { id: "c1", type: "CONNECT_TV", payload: { host: "not a host" } },
      deps(),
    );
    expect(replies[0]).toMatchObject({
      type: "ERROR",
      payload: { code: "INVALID_MESSAGE" },
    });
  });

  it("launches a supported app after connect", async () => {
    const handlerDeps = deps();

    await handleClientMessage({ id: "c1", type: "CONNECT_TV", payload: {} }, handlerDeps);
    const replies = await handleClientMessage(
      { id: "a1", type: "LAUNCH_APP", payload: { app: "youtube" } },
      handlerDeps,
    );

    expect(replies).toEqual([]);
  });
});
