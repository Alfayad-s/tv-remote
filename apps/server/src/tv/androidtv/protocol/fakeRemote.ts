import { EventEmitter } from "node:events";
import { normalizePairingPin } from "@tv-remote/shared";
import type {
  AndroidTvCertificate,
  AndroidTvRemoteFactory,
  AndroidTvRemoteFactoryOptions,
  AndroidTvRemoteSession,
} from "./client.js";

export const FAKE_PAIRING_PIN = "ABCD12";

const FAKE_CERTIFICATE: AndroidTvCertificate = {
  key: "-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----\n",
  cert: "-----BEGIN CERTIFICATE-----\nFAKE\n-----END CERTIFICATE-----\n",
};

/**
 * In-process Android TV Remote session for tests. It never opens TLS sockets.
 */
export class FakeAndroidTvRemote extends EventEmitter implements AndroidTvRemoteSession {
  readonly host: string;
  lastKeyCode: number | undefined;
  lastText: string | undefined;
  private readonly hasCert: boolean;
  private started = false;
  private resolveStart: ((value: boolean) => void) | undefined;

  constructor(host: string, options: AndroidTvRemoteFactoryOptions) {
    super();
    this.host = host;
    this.hasCert = Boolean(options.cert?.key && options.cert.cert);
  }

  start(): Promise<boolean> {
    if (this.hasCert) {
      this.started = true;
      queueMicrotask(() => {
        this.emit("ready");
      });
      return Promise.resolve(true);
    }

    return new Promise<boolean>((resolve) => {
      this.resolveStart = resolve;
      queueMicrotask(() => {
        this.emit("secret");
      });
    });
  }

  sendCode(code: string): boolean {
    if (normalizePairingPin(code) === FAKE_PAIRING_PIN) {
      this.started = true;
      this.resolveStart?.(true);
      this.resolveStart = undefined;
      queueMicrotask(() => {
        this.emit("ready");
      });
      return true;
    }

    this.resolveStart?.(false);
    this.resolveStart = undefined;
    return false;
  }

  sendKey(keyCode: number): void {
    this.lastKeyCode = keyCode;
  }

  sendText(text: string): void {
    this.lastText = text;
  }

  emitCurrentApp(appPackage = "com.google.android.youtube.tv"): void {
    this.emit("current_app", appPackage);
  }

  getCertificate(): AndroidTvCertificate {
    return FAKE_CERTIFICATE;
  }

  stop(): void {
    this.resolveStart?.(false);
    this.resolveStart = undefined;
    this.started = false;
  }

  isStarted(): boolean {
    return this.started;
  }
}

export function createFakeAndroidTvRemoteFactory(
  sessions: FakeAndroidTvRemote[] = [],
): AndroidTvRemoteFactory {
  return (host, options) => {
    const session = new FakeAndroidTvRemote(host, options);
    sessions.push(session);
    return session;
  };
}
