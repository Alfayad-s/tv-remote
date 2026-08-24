import { AppError } from "../../types/errors.js";
import type { ConnectOptions, TVAdapter, TVAdapterListener } from "../TVAdapter.js";
import type { RemoteCommand, TVDevice } from "@tv-remote/shared";

function isLoopbackHost(host: string | undefined): boolean {
  return host === undefined || host === "127.0.0.1" || host === "localhost" || host === "::1";
}

export function shouldUseMockAdapter(options?: ConnectOptions): boolean {
  if (options?.id === "mock-iffalcon") {
    return true;
  }
  return isLoopbackHost(options?.host);
}

export class SwitchingTVAdapter implements TVAdapter {
  private active: TVAdapter;
  private readonly mock: TVAdapter;
  private readonly androidtv: TVAdapter;

  constructor(adapters: { mock: TVAdapter; androidtv: TVAdapter }) {
    this.mock = adapters.mock;
    this.androidtv = adapters.androidtv;
    this.active = this.mock;
  }

  get name(): string {
    return this.active.name;
  }

  subscribe(listener: TVAdapterListener): () => void {
    const unsubMock = this.mock.subscribe?.(listener);
    const unsubAndroid = this.androidtv.subscribe?.(listener);
    return () => {
      unsubMock?.();
      unsubAndroid?.();
    };
  }

  async connect(options?: ConnectOptions): Promise<TVDevice> {
    this.active = shouldUseMockAdapter(options) ? this.mock : this.androidtv;
    return this.active.connect(options);
  }

  async disconnect(): Promise<void> {
    await this.active.disconnect();
  }

  async sendCommand(command: RemoteCommand): Promise<void> {
    await this.active.sendCommand(command);
  }

  async sendText(text: string): Promise<void> {
    await this.active.sendText(text);
  }

  async launchApp(appLink: string): Promise<void> {
    await this.active.launchApp(appLink);
  }

  async submitPin(pin: string): Promise<void> {
    if (!this.active.submitPin) {
      throw new AppError("UNSUPPORTED_DEVICE", "This adapter does not implement PIN pairing.");
    }
    await this.active.submitPin(pin);
  }

  getDevice(): TVDevice | null {
    return this.active.getDevice();
  }

  isConnected(): boolean {
    return this.active.isConnected();
  }
}
