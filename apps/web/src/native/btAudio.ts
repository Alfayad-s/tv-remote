import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface SpeakerState {
  connected: boolean;
  deviceName: string | null;
  volume: number;
  maxVolume: number;
  muted: boolean;
}

export interface BtAudioPlugin {
  getState(): Promise<SpeakerState>;
  requestBluetoothName(): Promise<SpeakerState>;
  setVolume(options: { level: number }): Promise<SpeakerState>;
  adjustVolume(options: { direction: "up" | "down" }): Promise<SpeakerState>;
  setMuted(options: { muted: boolean }): Promise<SpeakerState>;
  mediaKey(options: { key: "next" | "previous" }): Promise<void>;
  openSystemEqualizer(): Promise<void>;
  openBluetoothSettings(): Promise<void>;
  addListener(
    eventName: "state",
    listener: (state: SpeakerState) => void,
  ): Promise<PluginListenerHandle>;
}

export const BtAudio = registerPlugin<BtAudioPlugin>("BtAudio");

export const IDLE_SPEAKER_STATE: SpeakerState = {
  connected: false,
  deviceName: null,
  volume: 0,
  maxVolume: 15,
  muted: false,
};
