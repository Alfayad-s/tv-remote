import type { RemoteCommand, TVDevice } from "@tv-remote/shared";

export type TVAdapterEvent =
  | { type: "pairingRequired"; device: TVDevice }
  | { type: "unpaired"; device: TVDevice | null }
  | { type: "ime"; active: boolean };

export type TVAdapterListener = (event: TVAdapterEvent) => void;

export interface ConnectOptions {
  host?: string;
  id?: string;
  port?: number;
}

export interface TVAdapter {
  readonly name: string;
  connect(options?: ConnectOptions): Promise<TVDevice>;
  disconnect(): Promise<void>;
  sendCommand(command: RemoteCommand): Promise<void>;
  sendText(text: string): Promise<void>;
  getDevice(): TVDevice | null;
  isConnected(): boolean;
  submitPin?(pin: string): Promise<void>;
  subscribe?(listener: TVAdapterListener): () => void;
}
