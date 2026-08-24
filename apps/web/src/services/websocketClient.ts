import type { ClientMessage, RemoteCommand, ServerMessage } from "@tv-remote/shared";
import { validateServerMessage } from "@tv-remote/shared";
import { createReconnectScheduler } from "../utils/reconnect.js";
import { createMessageId, resolveWebSocketUrl } from "../utils/websocketUrl.js";

export type ServiceStatus = "connecting" | "open" | "closed";

export interface WebSocketClientHandlers {
  onServiceStatus: (status: ServiceStatus) => void;
  onMessage: (message: ServerMessage) => void;
  onMalformed: (reason: string) => void;
}

const HEARTBEAT_MS = 15_000;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private readonly reconnect = createReconnectScheduler();
  private heartbeat: number | undefined;
  private closedByUser = false;

  constructor(private readonly handlers: WebSocketClientHandlers) {}

  connect(): void {
    this.closedByUser = false;
    this.open();
  }

  disconnect(): void {
    this.closedByUser = true;
    this.reconnect.stop();
    this.clearHeartbeat();
    this.socket?.close();
    this.socket = null;
    this.handlers.onServiceStatus("closed");
  }

  send(message: Omit<ClientMessage, "id"> & { id?: string }): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    const id = message.id ?? createMessageId();
    this.socket.send(JSON.stringify({ ...message, id }));
    return true;
  }

  connectTv(options?: { host?: string; id?: string; port?: number }): void {
    this.send({
      type: "CONNECT_TV",
      payload: {
        ...(options?.host === undefined ? {} : { host: options.host }),
        ...(options?.id === undefined ? {} : { id: options.id }),
        ...(options?.port === undefined ? {} : { port: options.port }),
      },
    });
  }

  discoverTvs(): void {
    this.send({ type: "DISCOVER_TVS", payload: {} });
  }

  disconnectTv(): void {
    this.send({ type: "DISCONNECT_TV", payload: {} });
  }

  sendCommand(command: RemoteCommand): void {
    this.send({ type: "REMOTE_COMMAND", payload: { command } });
  }

  sendText(text: string): boolean {
    return this.send({ type: "SEND_TEXT", payload: { text } });
  }

  submitPin(pin: string): boolean {
    return this.send({ type: "SUBMIT_PIN", payload: { pin } });
  }

  private open(): void {
    this.handlers.onServiceStatus("connecting");
    const url = resolveWebSocketUrl();
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.reconnect.reset();
      this.handlers.onServiceStatus("open");
      this.startHeartbeat();
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") {
        this.handlers.onMalformed("Binary WebSocket frames are not supported.");
        return;
      }
      const parsed = validateServerMessage(event.data);
      if (!parsed.ok) {
        this.handlers.onMalformed(parsed.message);
        return;
      }
      this.handlers.onMessage(parsed.value);
    });

    socket.addEventListener("close", () => {
      this.clearHeartbeat();
      this.handlers.onServiceStatus("closed");
      if (!this.closedByUser) {
        const scheduled = this.reconnect.schedule(() => {
          this.open();
        });
        if (!scheduled) {
          this.handlers.onMalformed("Could not reconnect to the local service.");
        }
      }
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeat = window.setInterval(() => {
      this.send({ type: "PING", payload: { timestamp: Date.now() } });
    }, HEARTBEAT_MS);
  }

  private clearHeartbeat(): void {
    if (this.heartbeat !== undefined) {
      window.clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
  }
}
