import type { DeskApp, ServerMessage } from "@tv-remote/streamdesk-protocol";
import { STREAMDESK_DEFAULT_PORT } from "@tv-remote/streamdesk-protocol";

const SESSION_KEY = "streamdesk.session.v1";

export interface SavedSession {
  host: string;
  port: number;
  token: string | null;
}

export function readSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed.host) {
      return null;
    }
    return {
      host: parsed.host,
      port: parsed.port || STREAMDESK_DEFAULT_PORT,
      token: parsed.token,
    };
  } catch {
    return null;
  }
}

export function writeSession(session: SavedSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export type DeskStatus = "idle" | "connecting" | "needs_pin" | "connected" | "error";

export interface DeskClientHandlers {
  onStatus: (status: DeskStatus) => void;
  onHostName: (name: string) => void;
  onApps: (desk: DeskApp[], apps: DeskApp[], running: DeskApp[]) => void;
  onError: (message: string) => void;
  onPaired: (token: string) => void;
}

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class DeskClient {
  private socket: WebSocket | null = null;
  private host = "";
  private port = STREAMDESK_DEFAULT_PORT;
  private token: string | null = null;
  private pendingPin: string | null = null;

  constructor(private readonly handlers: DeskClientHandlers) {}

  connect(
    host: string,
    port = STREAMDESK_DEFAULT_PORT,
    token: string | null = null,
    pin: string | null = null,
  ): void {
    this.disconnect();
    this.host = host.trim();
    this.port = port;
    this.token = token;
    this.pendingPin = pin?.trim() || null;
    this.handlers.onStatus("connecting");
    const url = `ws://${this.host}:${String(this.port)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      if (this.token) {
        this.send({ type: "AUTH", id: nextId(), token: this.token });
        return;
      }
      if (this.pendingPin) {
        this.pair(this.pendingPin);
        this.pendingPin = null;
        return;
      }
      this.handlers.onStatus("needs_pin");
    });

    socket.addEventListener("message", (event) => {
      this.onMessage(String(event.data));
    });

    socket.addEventListener("close", () => {
      if (this.socket === socket) {
        this.socket = null;
        this.handlers.onStatus("idle");
      }
    });

    socket.addEventListener("error", () => {
      this.handlers.onError("Could not reach the Mac. Is StreamDesk Desk running on the same Wi‑Fi?");
      this.handlers.onStatus("error");
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  pair(pin: string): void {
    this.send({
      type: "PAIR",
      id: nextId(),
      pin: pin.trim(),
      deviceName: "Phone",
    });
  }

  refresh(): void {
    this.send({ type: "LIST_APPS", id: nextId() });
  }

  launch(appId: string): void {
    this.send({ type: "LAUNCH", id: nextId(), appId });
  }

  activate(appId: string): void {
    this.send({ type: "ACTIVATE", id: nextId(), appId });
  }

  quit(appId: string): void {
    this.send({ type: "QUIT", id: nextId(), appId });
  }

  private send(message: object): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.handlers.onError("Not connected to the Mac.");
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  private onMessage(raw: string): void {
    let message: ServerMessage;
    try {
      message = JSON.parse(raw) as ServerMessage;
    } catch {
      this.handlers.onError("Bad message from desk.");
      return;
    }

    switch (message.type) {
      case "HELLO":
        this.handlers.onHostName(message.payload.hostName);
        if (!this.token) {
          this.handlers.onStatus("needs_pin");
        }
        break;
      case "PAIR_RESULT":
        if (message.payload.ok && message.payload.token) {
          this.token = message.payload.token;
          writeSession({ host: this.host, port: this.port, token: this.token });
          this.handlers.onPaired(this.token);
          this.handlers.onStatus("connected");
        } else {
          this.handlers.onError(message.payload.message ?? "Pairing failed.");
          this.handlers.onStatus("needs_pin");
        }
        break;
      case "AUTH_RESULT":
        if (message.payload.ok) {
          this.handlers.onStatus("connected");
        } else {
          clearSession();
          this.token = null;
          this.handlers.onError(message.payload.message ?? "Session expired.");
          this.handlers.onStatus("needs_pin");
        }
        break;
      case "APP_LIST":
        this.handlers.onApps(
          message.payload.desk ?? message.payload.apps,
          message.payload.apps,
          message.payload.running,
        );
        this.handlers.onStatus("connected");
        break;
      case "COMMAND_ACK":
        if (!message.payload.ok) {
          this.handlers.onError(message.payload.message ?? "Command failed.");
        }
        break;
      case "ERROR":
        this.handlers.onError(message.payload.message);
        break;
      case "PONG":
      case "APP_EVENT":
        break;
    }
  }
}
