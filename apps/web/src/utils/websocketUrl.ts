import { isPrivateHostname } from "./homeNetwork.js";

export interface PageLocation {
  protocol: string;
  hostname: string;
  port: string;
}

export interface WebSocketEnv {
  VITE_WS_URL?: string;
  VITE_WS_PORT?: string;
}

const DEV_WEB_PORTS = new Set(["5173", "4173"]);

export function resolveWebSocketUrl(
  location: PageLocation = window.location,
  env: WebSocketEnv = import.meta.env,
): string {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";

  if (isPrivateHostname(location.hostname)) {
    if (DEV_WEB_PORTS.has(location.port)) {
      return `${protocol}//${location.hostname}:${location.port}/ws`;
    }
    const port = location.port || env.VITE_WS_PORT || "8787";
    return `${protocol}//${location.hostname}:${port}/ws`;
  }

  const configured = env.VITE_WS_URL;
  if (configured && configured.length > 0) {
    return configured;
  }

  if (location.protocol === "https:") {
    return `wss://${location.hostname}/ws`;
  }

  const port = location.port || env.VITE_WS_PORT || "8787";
  return `${protocol}//${location.hostname}:${port}/ws`;
}

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
