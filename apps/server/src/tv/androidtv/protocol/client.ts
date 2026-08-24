export interface AndroidTvCertificate {
  key: string;
  cert: string;
}

export interface AndroidTvRemoteSession {
  start(): Promise<boolean>;
  sendCode(code: string): boolean;
  sendKey(keyCode: number): void;
  sendText(text: string): void;
  sendAppLink(appLink: string): void;
  getCertificate(): AndroidTvCertificate;
  stop(): void;
  on(event: "secret" | "ready" | "unpaired", listener: () => void): void;
  on(event: "error", listener: (error: Error) => void): void;
  on(event: "current_app", listener: (appPackage: string) => void): void;
}

export interface AndroidTvRemoteFactoryOptions {
  cert?: AndroidTvCertificate;
  pairingPort: number;
  remotePort: number;
  serviceName: string;
  model: string;
}

export type AndroidTvRemoteFactory = (
  host: string,
  options: AndroidTvRemoteFactoryOptions,
) => AndroidTvRemoteSession;
