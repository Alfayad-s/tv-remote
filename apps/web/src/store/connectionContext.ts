import type { ConnectionState, RemoteCommand, TvAppId, TVDevice } from "@tv-remote/shared";
import { createContext } from "react";
import type { ServiceStatus } from "../services/websocketClient.js";

export type DiscoveryStatus = "idle" | "searching" | "done";

export interface ConnectTvOptions {
  host?: string;
  id?: string;
  port?: number;
}

export interface ConnectionStore {
  serviceStatus: ServiceStatus;
  tvState: ConnectionState;
  tv: TVDevice | null;
  devices: TVDevice[];
  selectedTvId: string | null;
  discoveryStatus: DiscoveryStatus;
  lastError: string | null;
  lastCommand: RemoteCommand | null;
  imeActive: boolean;
  connectTv: (options?: ConnectTvOptions) => void;
  disconnectTv: () => void;
  sendCommand: (command: RemoteCommand) => void;
  sendText: (text: string) => boolean;
  launchApp: (app: TvAppId) => boolean;
  submitPin: (pin: string) => boolean;
  discoverTvs: () => void;
  selectTv: (id: string) => void;
}

export const ConnectionContext = createContext<ConnectionStore | null>(null);
