import {
  DEFAULT_PAIRING_PORT,
  DEFAULT_REMOTE_PORT,
  type RemoteCommand,
  type TVDevice,
  type TVDeviceSource,
} from "@tv-remote/shared";
import {
  clearCredentials,
  loadCredentials,
  type CredentialStore,
} from "../../storage/credentialStore.js";
import { AppError } from "../../types/errors.js";
import type { ConnectOptions, TVAdapter, TVAdapterEvent, TVAdapterListener } from "../TVAdapter.js";
import { toAndroidKeyCode } from "../androidtv/commands/keyMap.js";
import type {
  AndroidTvRemoteFactory,
  AndroidTvRemoteSession,
} from "../androidtv/protocol/client.js";
import { createKudAndroidTvRemote } from "../androidtv/protocol/kudRemote.js";
import { cloudLanConnectError, isCloudRuntime, isPrivateIpv4 } from "../../net/lan.js";
import { probeTcp } from "../../net/tcpProbe.js";

const DEFAULT_PAIRING_TIMEOUT_MS = 90_000;
const DEFAULT_CONNECT_PROBE_MS = 8_000;
const DEFAULT_CLIENT_NAME = "iFFALCON Remote";

export interface AndroidTVAdapterOptions {
  credentials: CredentialStore;
  createRemote?: AndroidTvRemoteFactory;
  pairingTimeoutMs?: number;
  clientName?: string;
  pairingPort?: number;
}

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "localhost" || host === "::1";
}

function deviceSource(id: string | undefined): TVDeviceSource {
  if (id?.startsWith("manual:")) {
    return "manual";
  }
  if (id?.startsWith("mock:")) {
    return "mock";
  }
  return "mdns";
}

function toDevice(
  options: ConnectOptions | undefined,
  host: string,
  port: number,
  connected: boolean,
): TVDevice {
  const id = options?.id ?? `androidtv:${host}`;
  return {
    id,
    name: "Android TV",
    host,
    port,
    brand: "ANDROID_TV",
    connected,
    source: deviceSource(options?.id),
  };
}

export class AndroidTVAdapter implements TVAdapter {
  readonly name = "androidtv";
  private readonly credentials: CredentialStore;
  private readonly createRemote: AndroidTvRemoteFactory;
  private readonly pairingTimeoutMs: number;
  private readonly clientName: string;
  private readonly pairingPort: number;
  private readonly probeNetwork: boolean;
  private readonly listeners = new Set<TVAdapterListener>();
  private session: AndroidTvRemoteSession | null = null;
  private device: TVDevice | null = null;
  private connected = false;
  private pairing = false;
  private connectGeneration = 0;

  constructor(options: AndroidTVAdapterOptions) {
    this.credentials = options.credentials;
    this.createRemote = options.createRemote ?? createKudAndroidTvRemote;
    this.pairingTimeoutMs = options.pairingTimeoutMs ?? DEFAULT_PAIRING_TIMEOUT_MS;
    this.clientName = options.clientName ?? DEFAULT_CLIENT_NAME;
    this.pairingPort = options.pairingPort ?? DEFAULT_PAIRING_PORT;
    this.probeNetwork = options.createRemote === undefined;
  }

  subscribe(listener: TVAdapterListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async connect(options?: ConnectOptions): Promise<TVDevice> {
    const host = options?.host;
    if (!host || isLoopbackHost(host)) {
      throw new AppError(
        "CONNECTION_FAILED",
        "A LAN TV address is required for Android TV pairing.",
      );
    }

    if (isPrivateIpv4(host) && isCloudRuntime()) {
      throw cloudLanConnectError(host);
    }

    if (this.probeNetwork) {
      await probeTcp(host, this.pairingPort, DEFAULT_CONNECT_PROBE_MS);
    }

    const generation = ++this.connectGeneration;
    await this.resetSession();

    const remotePort = options?.port ?? DEFAULT_REMOTE_PORT;
    const tvId = options?.id ?? `androidtv:${host}`;
    this.device = toDevice(options, host, remotePort, false);
    this.pairing = false;
    this.connected = false;

    const stored = await loadCredentials(this.credentials, tvId, host);
    const session = this.createRemote(host, {
      pairingPort: this.pairingPort,
      remotePort,
      serviceName: this.clientName,
      model: this.clientName,
      ...(stored === null
        ? {}
        : {
            cert: { key: stored.keyPem, cert: stored.certPem },
          }),
    });
    this.session = session;

    session.on("secret", () => {
      if (generation !== this.connectGeneration) {
        return;
      }
      this.pairing = true;
      const device = this.device ?? toDevice(options, host, remotePort, false);
      this.emit({ type: "pairingRequired", device });
    });

    session.on("unpaired", () => {
      void this.handleUnpaired(tvId, host);
    });

    session.on("error", () => {
      // Connection errors are surfaced through start() / sendCommand.
    });

    session.on("current_app", () => {
      if (generation !== this.connectGeneration) {
        return;
      }
      this.emit({ type: "ime", active: true });
    });

    try {
      const started = await this.startWithTimeout(session);
      if (generation !== this.connectGeneration) {
        throw new AppError("CONNECTION_FAILED", "Connection cancelled.");
      }
      if (!started) {
        throw new AppError("PAIRING_FAILED");
      }
    } catch (error) {
      if (generation !== this.connectGeneration) {
        throw error;
      }
      await this.resetSession();
      throw error;
    }

    const certificate = session.getCertificate();
    if (certificate.cert.length > 0 && certificate.key.length > 0) {
      await this.credentials.save({
        tvId,
        host,
        certPem: certificate.cert,
        keyPem: certificate.key,
      });
    }

    this.pairing = false;
    this.connected = true;
    this.device = toDevice(options, host, remotePort, true);
    return this.device;
  }

  async disconnect(): Promise<void> {
    this.connectGeneration += 1;
    this.emit({ type: "ime", active: false });
    await this.resetSession();
    if (this.device) {
      this.device = { ...this.device, connected: false };
    }
  }

  async sendCommand(command: RemoteCommand): Promise<void> {
    if (!this.connected || !this.session) {
      throw new AppError("CONNECTION_FAILED", "Connect to the TV before sending commands.");
    }
    this.session.sendKey(toAndroidKeyCode(command));
    if (command === "HOME") {
      this.emit({ type: "ime", active: false });
    }
  }

  async sendText(text: string): Promise<void> {
    if (!this.connected || !this.session) {
      throw new AppError("CONNECTION_FAILED", "Connect to the TV before sending text.");
    }
    this.session.sendText(text);
  }

  async submitPin(pin: string): Promise<void> {
    if (!this.session || !this.pairing) {
      throw new AppError("PAIRING_REQUIRED", "Pairing is not in progress.");
    }
    let accepted: boolean;
    try {
      accepted = this.session.sendCode(pin);
    } catch {
      throw new AppError(
        "PROTOCOL_ERROR",
        "The TV rejected the pairing exchange. Cancel and connect again, then re-enter the code.",
      );
    }
    if (!accepted) {
      throw new AppError("INVALID_PIN");
    }
  }

  getDevice(): TVDevice | null {
    return this.device;
  }

  isConnected(): boolean {
    return this.connected;
  }

  private async startWithTimeout(session: AndroidTvRemoteSession): Promise<boolean> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ignoreLateStart = false;

    const timeout = new Promise<boolean>((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new AppError(
            "CONNECTION_TIMEOUT",
            "Pairing did not complete in time. Check the code on the TV and try again.",
          ),
        );
        session.stop();
      }, this.pairingTimeoutMs);
      timer.unref?.();
    });

    const started = session.start().catch((error: unknown) => {
      if (ignoreLateStart) {
        return false;
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("PAIRING_FAILED");
    });

    try {
      return await Promise.race([started, timeout]);
    } finally {
      ignoreLateStart = true;
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  private async handleUnpaired(tvId: string, host: string): Promise<void> {
    await clearCredentials(this.credentials, tvId, host);
    this.connected = false;
    this.pairing = false;
    if (this.device) {
      this.device = { ...this.device, connected: false };
    }
    this.emit({ type: "unpaired", device: this.device });
  }

  private async resetSession(): Promise<void> {
    this.session?.stop();
    this.session = null;
    this.connected = false;
    this.pairing = false;
  }

  private emit(event: TVAdapterEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
