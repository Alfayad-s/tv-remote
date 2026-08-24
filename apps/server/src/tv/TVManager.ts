import { randomUUID } from "node:crypto";
import type {
  ConnectionState,
  RemoteCommand,
  ServerMessage,
  TvAppId,
  TVDevice,
} from "@tv-remote/shared";
import { tvAppLink } from "@tv-remote/shared";
import type { Logger } from "../logger.js";
import { AppError, isCancelledError, toAppError } from "../types/errors.js";
import type { ConnectOptions, TVAdapter } from "./TVAdapter.js";

export type TVManagerListener = (message: ServerMessage) => void;

export class TVManager {
  private state: ConnectionState = "DISCONNECTED";
  private readonly listeners = new Set<TVManagerListener>();
  private connectEpoch = 0;
  private readonly unsubscribeAdapter: (() => void) | undefined;

  constructor(
    private readonly adapter: TVAdapter,
    private readonly logger: Logger,
  ) {
    this.unsubscribeAdapter = adapter.subscribe?.((event) => {
      if (event.type === "pairingRequired") {
        this.setState("PAIRING", event.device);
        this.emit({
          id: randomUUID(),
          type: "TV_EVENT",
          payload: { event: "PAIRING", tv: event.device },
        });
        this.logger.info("TV pairing required", {
          host: event.device.host,
          name: event.device.name,
        });
        return;
      }

      if (event.type === "ime") {
        this.emit({
          id: randomUUID(),
          type: "IME_STATE",
          payload: { active: event.active },
        });
        this.logger.debug("TV text field state", { active: event.active });
        return;
      }

      this.setState("ERROR", event.device);
      this.emit({
        id: randomUUID(),
        type: "ERROR",
        payload: {
          code: "AUTHENTICATION_FAILED",
          message: "The saved pairing is no longer valid. Pair the TV again.",
        },
      });
      this.logger.warn("TV unpaired", { host: event.device?.host });
    });
  }

  subscribe(listener: TVManagerListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  getDevice(): TVDevice | null {
    return this.adapter.getDevice();
  }

  getAdapterName(): "mock" | "androidtv" {
    return this.adapter.name === "androidtv" ? "androidtv" : "mock";
  }

  async connect(options?: ConnectOptions): Promise<TVDevice> {
    const epoch = ++this.connectEpoch;
    const host = options?.host;
    this.setState("CONNECTING");
    this.logger.info("Connecting to TV", {
      adapter: this.adapter.name,
      host,
      port: options?.port,
    });

    try {
      const device = await this.adapter.connect(options);
      if (epoch !== this.connectEpoch) {
        throw new AppError("CONNECTION_FAILED", "Connection cancelled.");
      }

      if (this.state === "PAIRING") {
        this.emit({
          id: randomUUID(),
          type: "TV_EVENT",
          payload: { event: "PAIRED", tv: device },
        });
      }

      this.setState("CONNECTED", device);
      this.emit({
        id: randomUUID(),
        type: "TV_EVENT",
        payload: { event: "CONNECTED", tv: device },
      });
      this.logger.info("Connected to TV", { name: device.name, host: device.host });
      return device;
    } catch (error) {
      if (epoch !== this.connectEpoch || isCancelledError(error)) {
        throw new AppError("CONNECTION_FAILED", "Connection cancelled.");
      }
      const appError = toAppError(error);
      this.setState("ERROR", this.adapter.getDevice());
      this.emit({
        id: randomUUID(),
        type: "ERROR",
        payload: { code: appError.code, message: appError.message },
      });
      throw appError;
    }
  }

  async disconnect(): Promise<void> {
    this.connectEpoch += 1;
    await this.adapter.disconnect();
    const device = this.adapter.getDevice();
    this.setState("DISCONNECTED", device);
    this.emit({
      id: randomUUID(),
      type: "TV_EVENT",
      payload: { event: "DISCONNECTED", tv: device },
    });
    this.logger.info("Disconnected from TV");
  }

  async sendCommand(command: RemoteCommand): Promise<void> {
    if (!this.adapter.isConnected()) {
      throw new AppError("CONNECTION_FAILED", "Connect to the TV before sending commands.");
    }

    await this.adapter.sendCommand(command);
    this.emit({
      id: randomUUID(),
      type: "TV_EVENT",
      payload: {
        event: "COMMAND_SENT",
        tv: this.adapter.getDevice(),
        command,
      },
    });
    this.logger.debug("Sent remote command", { command, adapter: this.adapter.name });
  }

  async sendText(text: string): Promise<void> {
    if (!this.adapter.isConnected()) {
      throw new AppError("CONNECTION_FAILED", "Connect to the TV before sending text.");
    }

    await this.adapter.sendText(text);
    this.emit({
      id: randomUUID(),
      type: "TV_EVENT",
      payload: {
        event: "COMMAND_SENT",
        tv: this.adapter.getDevice(),
      },
    });
    this.logger.debug("Sent text to TV", { length: text.length, adapter: this.adapter.name });
  }

  async launchApp(app: TvAppId): Promise<void> {
    if (!this.adapter.isConnected()) {
      throw new AppError("CONNECTION_FAILED", "Connect to the TV before launching an app.");
    }

    await this.adapter.launchApp(tvAppLink(app));
    this.emit({
      id: randomUUID(),
      type: "TV_EVENT",
      payload: {
        event: "COMMAND_SENT",
        tv: this.adapter.getDevice(),
      },
    });
    this.logger.debug("Launched TV app", { app, adapter: this.adapter.name });
  }

  async submitPin(pin: string): Promise<void> {
    if (!this.adapter.submitPin) {
      throw new AppError("UNSUPPORTED_DEVICE", "This adapter does not implement PIN pairing.");
    }
    if (this.state !== "PAIRING" && this.state !== "CONNECTING") {
      throw new AppError("PAIRING_REQUIRED", "Pairing is not in progress.");
    }
    this.logger.info("Sending pairing PIN to TV", { adapter: this.adapter.name });
    await this.adapter.submitPin(pin);
    this.logger.info("Pairing PIN accepted by protocol");
  }

  dispose(): void {
    this.unsubscribeAdapter?.();
  }

  private setState(state: ConnectionState, tv: TVDevice | null = this.adapter.getDevice()): void {
    this.state = state;
    this.emit({
      id: randomUUID(),
      type: "CONNECTION_STATE",
      payload: { state, tv },
    });
  }

  private emit(message: ServerMessage): void {
    for (const listener of this.listeners) {
      listener(message);
    }
  }
}
