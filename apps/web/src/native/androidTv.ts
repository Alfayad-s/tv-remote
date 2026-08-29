import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { RemoteCommand } from "@tv-remote/shared";

export interface NativeTvDevice {
  id: string;
  name: string;
  host: string;
  port?: number;
}

export interface AndroidTvPlugin {
  ready(): Promise<void>;
  requestLocalNetwork(): Promise<{ granted: boolean }>;
  getState(): Promise<{ json: string }>;
  discover(): Promise<void>;
  connect(options: { host: string; id?: string; port?: number }): Promise<void>;
  disconnect(): Promise<void>;
  reset(): Promise<void>;
  submitPin(options: { pin: string }): Promise<void>;
  sendKey(options: { command: RemoteCommand }): Promise<void>;
  sendText(options: { text: string }): Promise<void>;
  launchApp(options: { appLink: string }): Promise<void>;
  addListener(
    eventName: "message",
    listener: (event: { json: string }) => void,
  ): Promise<PluginListenerHandle>;
}

export const AndroidTv = registerPlugin<AndroidTvPlugin>("AndroidTv");
