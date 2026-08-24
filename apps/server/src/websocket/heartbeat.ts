import type { WebSocket } from "ws";
import type { Logger } from "../logger.js";

const HEARTBEAT_MS = 15_000;

interface HeartbeatSocket extends WebSocket {
  isAlive?: boolean;
}

export function startHeartbeat(sockets: Iterable<WebSocket>, logger: Logger): () => void {
  const timer = setInterval(() => {
    for (const socket of sockets) {
      const hbSocket = socket as HeartbeatSocket;
      if (hbSocket.isAlive === false) {
        logger.warn("Terminating WebSocket client after missed heartbeat");
        socket.terminate();
        continue;
      }
      hbSocket.isAlive = false;
      socket.ping();
    }
  }, HEARTBEAT_MS);

  timer.unref();

  return () => {
    clearInterval(timer);
  };
}

export function attachHeartbeat(socket: WebSocket): void {
  const hbSocket = socket as HeartbeatSocket;
  hbSocket.isAlive = true;
  socket.on("pong", () => {
    hbSocket.isAlive = true;
  });
}
