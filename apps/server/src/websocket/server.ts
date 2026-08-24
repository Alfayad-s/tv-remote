import { randomUUID } from "node:crypto";
import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { ServerMessage } from "@tv-remote/shared";
import type { ServerConfig } from "../config/env.js";
import type { DiscoveryService } from "../discovery/DiscoveryService.js";
import { tryServeWebAsset } from "../http/static.js";
import type { Logger } from "../logger.js";
import { isCloudRuntime } from "../net/lan.js";
import type { TVManager } from "../tv/TVManager.js";
import { attachHeartbeat, startHeartbeat } from "./heartbeat.js";
import { handleClientMessage } from "./messageHandler.js";

export interface GatewayDeps {
  config: ServerConfig;
  logger: Logger;
  tvManager: TVManager;
  discovery: DiscoveryService;
}

export interface Gateway {
  httpServer: HttpServer;
  wss: WebSocketServer;
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

function pathnameOf(request: IncomingMessage): string {
  try {
    return new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    return "/";
  }
}

function handleHttpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  deps: GatewayDeps,
): void {
  const { config } = deps;
  const pathname = pathnameOf(request);

  if ((request.method === "GET" || request.method === "HEAD") && pathname === "/health") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ ok: true, runtime: isCloudRuntime() ? "cloud" : "home" }));
    return;
  }

  if (config.webDist && tryServeWebAsset(request, response, config.webDist)) {
    return;
  }

  if ((request.method === "GET" || request.method === "HEAD") && pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(
      "iFFALCON remote service is running. Run npm run build so this URL can serve the phone app.",
    );
    return;
  }

  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found");
}

function attachSocketHandlers(wss: WebSocketServer, deps: GatewayDeps): () => void {
  const { config, logger, tvManager, discovery } = deps;
  const clients = new Set<WebSocket>();
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

  return () => {
    stopHeartbeat();
    unsubscribe();
  };
}

export function createGateway(deps: GatewayDeps): Gateway {
  const { config, logger } = deps;
  const httpServer = createServer((request, response) => {
    handleHttpRequest(request, response, deps);
  });
  const wss = new WebSocketServer({ server: httpServer });
  const detach = attachSocketHandlers(wss, deps);

  httpServer.on("close", () => {
    detach();
  });

  httpServer.listen(config.port, config.host, () => {
    logger.info("Gateway listening", {
      host: config.host,
      port: config.port,
      adapter: config.adapter,
      webDist: config.webDist,
      runtime: isCloudRuntime() ? "cloud" : "home",
    });
  });

  return { httpServer, wss };
}
