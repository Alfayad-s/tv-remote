import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostname } from "node:os";
import { Bonjour } from "bonjour-service";
import {
  isClientMessage,
  STREAMDESK_DEFAULT_PORT,
  STREAMDESK_SERVICE_TYPE,
  type ClientMessage,
  type ServerMessage,
} from "@tv-remote/streamdesk-protocol";
import { WebSocketServer, type WebSocket } from "ws";
import { activateApp, launchApp, listApps, quitApp } from "./macApps.js";
import { ensureAppIcon, iconFilePath, prefetchIcons } from "./icons.js";
import { readLayout, writeLayout } from "./layout.js";
import {
  createPairingPin,
  findDevice,
  listPairedDevices,
  pairDevice,
} from "./store.js";

interface Session {
  socket: WebSocket;
  authenticated: boolean;
  deviceName: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));

function loadDeskHtml(): string {
  const candidates = [
    join(HERE, "desk.html"),
    join(process.cwd(), "desk.html"),
    join(HERE, "src", "desk.html"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return readFileSync(path, "utf8");
    }
  }
  throw new Error("desk.html not found next to the StreamDesk Desk binary.");
}

const DESK_HTML = loadDeskHtml();

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function messageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function printBanner(port: number, pin: string): void {
  console.log("");
  console.log("╔══════════════════════════════════════════╗");
  console.log("║            StreamDesk Desk               ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log(`║  Host PIN:  ${pin}                     ║`);
  console.log(`║  Port:      ${String(port).padEnd(28)}║`);
  console.log(`║  Arrange:   http://localhost:${String(port).padEnd(13)}║`);
  console.log("╚══════════════════════════════════════════╝");
  console.log("Open Arrange in a browser to add apps + icons for the phone.");
  console.log("");
}

function publicBase(req: IncomingMessage | null, port: number): string {
  const hostHeader = req?.headers.host;
  if (hostHeader) {
    return `http://${hostHeader}`;
  }
  return `http://127.0.0.1:${String(port)}`;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

export async function startDeskServer(port = STREAMDESK_DEFAULT_PORT): Promise<{
  port: number;
  getPin: () => string;
  stop: () => void;
}> {
  let pin = createPairingPin();
  const sessions = new Set<Session>();

  const rotatePin = (): void => {
    pin = createPairingPin();
    printBanner(port, pin);
  };

  const broadcastApps = async (req: IncomingMessage | null = null): Promise<void> => {
    const listed = await listApps(publicBase(req, port));
    for (const session of sessions) {
      if (session.authenticated) {
        send(session.socket, {
          type: "APP_LIST",
          id: messageId(),
          payload: listed,
        });
      }
    }
  };

  const httpServer = createServer((req, res) => {
    void handleHttp(req, res, () => pin, port, broadcastApps);
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket, req) => {
    const session: Session = {
      socket,
      authenticated: false,
      deviceName: "Phone",
    };
    sessions.add(session);
    const base = publicBase(req, port);

    send(socket, {
      type: "HELLO",
      id: messageId(),
      payload: {
        hostName: hostname(),
        port,
        needsPairing: true,
      },
    });

    socket.on("message", (raw) => {
      void handleMessage(session, raw.toString(), () => pin, rotatePin, base);
    });

    socket.on("close", () => {
      sessions.delete(session);
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, "0.0.0.0", () => resolve());
  });

  const bonjour = new Bonjour();
  const service = bonjour.publish({
    name: `StreamDesk (${hostname()})`,
    type: STREAMDESK_SERVICE_TYPE,
    port,
  });

  printBanner(port, pin);

  return {
    port,
    getPin: () => pin,
    stop: () => {
      service.stop();
      bonjour.destroy();
      wss.close();
      httpServer.close();
    },
  };
}

async function handleHttp(
  req: IncomingMessage,
  res: ServerResponse,
  getPin: () => string,
  port: number,
  broadcastApps: (req: IncomingMessage | null) => Promise<void>,
): Promise<void> {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const base = publicBase(req, port);

  try {
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/desk")) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(DESK_HTML);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      json(res, 200, {
        pin: getPin(),
        hostName: hostname(),
        port,
        pairedDevices: listPairedDevices().length,
        arrangeUrl: `${base}/`,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/apps") {
      const listed = await listApps(base);
      json(res, 200, listed);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/layout") {
      json(res, 200, readLayout());
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/layout") {
      const raw = await readBody(req);
      const body = JSON.parse(raw) as { appIds?: unknown };
      const appIds = Array.isArray(body.appIds)
        ? body.appIds.filter((id): id is string => typeof id === "string")
        : [];
      writeLayout({ appIds });
      prefetchIcons(appIds);
      const listed = await listApps(base);
      await broadcastApps(req);
      json(res, 200, listed);
      return;
    }

    if (req.method === "GET" && url.pathname.startsWith("/icons/")) {
      const fileName = decodeURIComponent(url.pathname.slice("/icons/".length));
      const appId = fileName.replace(/\.png$/iu, "");
      await ensureAppIcon(appId);
      const file = iconFilePath(appId);
      if (!existsSync(file)) {
        res.writeHead(404).end("Icon not found");
        return;
      }
      res.writeHead(200, {
        "content-type": "image/png",
        "cache-control": "public, max-age=86400",
      });
      res.end(readFileSync(file));
      return;
    }

    res.writeHead(404).end("Not found");
  } catch (error: unknown) {
    json(res, 500, {
      message: error instanceof Error ? error.message : "Server error",
    });
  }
}

async function handleMessage(
  session: Session,
  raw: string,
  getPin: () => string,
  rotatePin: () => void,
  publicBaseUrl: string,
): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    send(session.socket, {
      type: "ERROR",
      id: messageId(),
      payload: { message: "Invalid JSON." },
    });
    return;
  }

  if (!isClientMessage(parsed)) {
    send(session.socket, {
      type: "ERROR",
      id: messageId(),
      payload: { message: "Unknown message." },
    });
    return;
  }

  const message = parsed;
  try {
    switch (message.type) {
      case "PING":
        send(session.socket, { type: "PONG", id: message.id });
        return;
      case "PAIR":
        await onPair(session, message, getPin, rotatePin, publicBaseUrl);
        return;
      case "AUTH":
        await onAuth(session, message, publicBaseUrl);
        return;
      case "LIST_APPS":
      case "LAUNCH":
      case "ACTIVATE":
      case "QUIT":
        if (!session.authenticated) {
          send(session.socket, {
            type: "ERROR",
            id: message.id,
            payload: { message: "Pair or sign in first." },
          });
          return;
        }
        await onCommand(session, message, publicBaseUrl);
        return;
    }
  } catch (error: unknown) {
    send(session.socket, {
      type: "ERROR",
      id: message.id,
      payload: {
        message: error instanceof Error ? error.message : "Command failed.",
      },
    });
  }
}

async function onPair(
  session: Session,
  message: Extract<ClientMessage, { type: "PAIR" }>,
  getPin: () => string,
  rotatePin: () => void,
  publicBaseUrl: string,
): Promise<void> {
  if (message.pin.trim() !== getPin()) {
    send(session.socket, {
      type: "PAIR_RESULT",
      id: message.id,
      payload: { ok: false, message: "Wrong PIN. Check the Mac desk window." },
    });
    return;
  }
  const device = pairDevice(message.deviceName ?? "Phone");
  session.authenticated = true;
  session.deviceName = device.deviceName;
  rotatePin();
  send(session.socket, {
    type: "PAIR_RESULT",
    id: message.id,
    payload: { ok: true, token: device.token },
  });
  const listed = await listApps(publicBaseUrl);
  send(session.socket, {
    type: "APP_LIST",
    id: messageId(),
    payload: listed,
  });
}

async function onAuth(
  session: Session,
  message: Extract<ClientMessage, { type: "AUTH" }>,
  publicBaseUrl: string,
): Promise<void> {
  const device = findDevice(message.token);
  if (!device) {
    send(session.socket, {
      type: "AUTH_RESULT",
      id: message.id,
      payload: { ok: false, message: "Unknown device. Pair again with the PIN." },
    });
    return;
  }
  session.authenticated = true;
  session.deviceName = device.deviceName;
  send(session.socket, {
    type: "AUTH_RESULT",
    id: message.id,
    payload: { ok: true },
  });
  const listed = await listApps(publicBaseUrl);
  send(session.socket, {
    type: "APP_LIST",
    id: messageId(),
    payload: listed,
  });
}

async function onCommand(
  session: Session,
  message: Extract<ClientMessage, { type: "LIST_APPS" | "LAUNCH" | "ACTIVATE" | "QUIT" }>,
  publicBaseUrl: string,
): Promise<void> {
  if (message.type === "LIST_APPS") {
    const listed = await listApps(publicBaseUrl);
    send(session.socket, {
      type: "APP_LIST",
      id: message.id,
      payload: listed,
    });
    return;
  }

  const appId = message.appId.trim();
  if (!appId) {
    send(session.socket, {
      type: "COMMAND_ACK",
      id: message.id,
      payload: { ok: false, action: message.type, appId, message: "Missing app." },
    });
    return;
  }

  if (message.type === "LAUNCH") {
    await launchApp(appId);
  } else if (message.type === "ACTIVATE") {
    await activateApp(appId);
  } else {
    await quitApp(appId);
  }

  send(session.socket, {
    type: "COMMAND_ACK",
    id: message.id,
    payload: { ok: true, action: message.type, appId },
  });

  const listed = await listApps(publicBaseUrl);
  send(session.socket, {
    type: "APP_LIST",
    id: messageId(),
    payload: listed,
  });
}
