import type { ClientMessage, RemoteCommand, ServerMessage, TvAppId } from "@tv-remote/shared";
import { tvAppLink, validateServerMessage } from "@tv-remote/shared";
import type { PluginListenerHandle } from "@capacitor/core";
import { AndroidTv } from "../native/androidTv.js";
import type { WebSocketClientHandlers } from "./websocketClient.js";

export class NativeTvClient {
  private listener: PluginListenerHandle | null = null;
  private ready = false;

  constructor(private readonly handlers: WebSocketClientHandlers) {}

  connect(): void {
    this.handlers.onServiceStatus("connecting");
    void this.start();
  }

  disconnect(): void {
    void this.listener?.remove();
    this.listener = null;
    this.ready = false;
  }

  send(_message: Omit<ClientMessage, "id"> & { id?: string }): boolean {
    return this.ready;
  }

  connectTv(options?: { host?: string; id?: string; port?: number }): void {
    if (!options?.host) {
      this.handlers.onMalformed("Enter the TV IP address.");
      return;
    }
    void AndroidTv.connect({
      host: options.host,
      ...(options.id === undefined ? {} : { id: options.id }),
      ...(options.port === undefined ? {} : { port: options.port }),
    }).catch((error: unknown) => {
      this.handlers.onMalformed(error instanceof Error ? error.message : "Could not connect.");
    });
  }

  discoverTvs(): void {
    void this.scanTvs();
  }

  private async scanTvs(): Promise<void> {
    try {
      const permission = await AndroidTv.requestLocalNetwork();
      if (!permission.granted) {
        this.handlers.onMalformed(
          "Allow Nearby devices so this phone can find the TV. Then tap Scan again.",
        );
      }
    } catch {
      // Older APKs without requestLocalNetwork can still scan.
    }
    try {
      await AndroidTv.discover();
    } catch (error: unknown) {
      this.handlers.onMalformed(error instanceof Error ? error.message : "Scan failed.");
    }
  }

  disconnectTv(): void {
    void AndroidTv.disconnect();
  }

  async resetApp(): Promise<void> {
    try {
      await AndroidTv.reset();
    } catch {
      try {
        await AndroidTv.disconnect();
      } catch {
        // Older APKs without reset still drop the TV session.
      }
    }
  }

  sendCommand(command: RemoteCommand): void {
    void AndroidTv.sendKey({ command }).catch((error: unknown) => {
      this.handlers.onMalformed(error instanceof Error ? error.message : "Command failed.");
    });
  }

  sendText(text: string): boolean {
    void AndroidTv.sendText({ text }).catch((error: unknown) => {
      this.handlers.onMalformed(error instanceof Error ? error.message : "Could not send text.");
    });
    return true;
  }

  launchApp(app: TvAppId): boolean {
    void AndroidTv.launchApp({ appLink: tvAppLink(app) }).catch((error: unknown) => {
      this.handlers.onMalformed(error instanceof Error ? error.message : "Could not open the app.");
    });
    return true;
  }

  submitPin(pin: string): boolean {
    void AndroidTv.submitPin({ pin }).catch((error: unknown) => {
      this.handlers.onMalformed(error instanceof Error ? error.message : "PIN failed.");
    });
    return this.ready;
  }

  private async start(): Promise<void> {
    try {
      this.listener = await AndroidTv.addListener("message", (event) => {
        this.dispatch(event.json);
      });
      await AndroidTv.ready();
      try {
        const snapshot = await AndroidTv.getState();
        this.dispatch(snapshot.json);
      } catch {
        // Older APKs without getState still work — the UI restores via saved session.
      }
      this.ready = true;
      this.handlers.onServiceStatus("open");
      await this.scanTvs();
    } catch (error) {
      this.handlers.onServiceStatus("closed");
      this.handlers.onMalformed(
        error instanceof Error ? error.message : "Native TV plugin failed.",
      );
    }
  }

  private dispatch(raw: string): void {
    const parsed = validateServerMessage(raw);
    if (!parsed.ok) {
      this.handlers.onMalformed(parsed.message);
      return;
    }
    this.handlers.onMessage(parsed.value as ServerMessage);
  }
}
