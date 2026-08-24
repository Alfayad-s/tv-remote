import type { RemoteCommand, TVDevice } from "@tv-remote/shared";
import { DEFAULT_REMOTE_PORT } from "@tv-remote/shared";
import { AppError } from "../../types/errors.js";
import type { ConnectOptions, TVAdapter } from "../TVAdapter.js";

const MOCK_DEVICE: TVDevice = {
  id: "mock-iffalcon",
  name: "iFFALCON Living Room",
  host: "127.0.0.1",
  port: 6466,
  brand: "iFFALCON",
  model: "Mock Android TV",
  connected: false,
  source: "mock",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class MockTVAdapter implements TVAdapter {
  readonly name = "mock";
  private connected = false;
  private device: TVDevice = { ...MOCK_DEVICE };
  private readonly latencyMs: number;

  constructor(options?: { latencyMs?: number }) {
    this.latencyMs = options?.latencyMs ?? 150;
  }

  async connect(options?: ConnectOptions): Promise<TVDevice> {
    await delay(this.latencyMs);

    this.device = {
      ...MOCK_DEVICE,
      id: options?.id ?? MOCK_DEVICE.id,
      host: options?.host ?? MOCK_DEVICE.host,
      port: options?.port ?? DEFAULT_REMOTE_PORT,
      source: "mock",
      connected: true,
    };
    this.connected = true;
    return this.device;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.device = { ...this.device, connected: false };
  }

  async sendCommand(command: RemoteCommand): Promise<void> {
    if (!this.connected) {
      throw new AppError("CONNECTION_FAILED", "Mock TV is not connected.");
    }
    await delay(this.latencyMs);
    void command;
  }

  async sendText(text: string): Promise<void> {
    if (!this.connected) {
      throw new AppError("CONNECTION_FAILED", "Mock TV is not connected.");
    }
    await delay(this.latencyMs);
    void text;
  }

  getDevice(): TVDevice | null {
    return this.device;
  }

  isConnected(): boolean {
    return this.connected;
  }
}
