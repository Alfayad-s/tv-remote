import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { ServerMessage } from "@tv-remote/shared";
import type { ServerConfig } from "../config/env.js";
import type { DiscoveryService } from "../discovery/DiscoveryService.js";
import type { Logger } from "../logger.js";
import type { TVManager } from "../tv/TVManager.js";
import { attachHeartbeat, startHeartbeat } from "./heartbeat.js";
import { handleClientMessage } from "./messageHandler.js";

export interface GatewayDeps {
  config: ServerConfig;
  logger: Logger;
  tvManager: TVManager;
  discovery: DiscoveryService;
}

function originAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (allowedOrigins.length === 0) {
    return true;
  }
  return origin !== undefined && allowedOrigins.includes(origin);
}

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

export function createWebSocketServer(deps: GatewayDeps): WebSocketServer {
  const { config, logger, tvManager, discovery } = deps;
  const clients = new Set<WebSocket>();

  const wss = new WebSocketServer({
    host: config.host,
    port: config.port,
  });

  const stopHeartbeat = startHeartbeat(clients, logger);

  const unsubscribe = tvManager.subscribe((message) => {
    for (const client of clients) {
      send(client, message);
    }
  });

  wss.on("connection", (socket, request: IncomingMessage) => {
    const origin = request.headers.origin;
    if (!originAllowed(origin, config.allowedOrigins)) {
      logger.warn("Rejected WebSocket origin", { origin });
      socket.close(1008, "Origin not allowed");
      return;
    }

    clients.add(socket);
    attachHeartbeat(socket);
    logger.info("PWA client connected", { clients: clients.size });

    send(socket, {
      id: randomUUID(),
      type: "CONNECTION_STATE",
      payload: {
        state: tvManager.getState(),
        tv: tvManager.getDevice(),
      },
    });

    socket.on("message", (data) => {
      void (async () => {
        const replies = await handleClientMessage(data.toString(), {
          tvManager,
          discovery,
          logger,
        });
        for (const reply of replies) {
          send(socket, reply);
        }
      })();
    });

    socket.on("close", () => {
      clients.delete(socket);
      logger.info("PWA client disconnected", { clients: clients.size });
    });

    socket.on("error", (error) => {
      logger.error("WebSocket client error", { error: error.message });
    });
  });

  wss.on("listening", () => {
    logger.info("WebSocket server listening", {
      host: config.host,
      port: config.port,
      adapter: config.adapter,
    });
  });

  wss.on("close", () => {
    stopHeartbeat();
    unsubscribe();
  });

  return wss;
}
