import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export interface SpeakerState {
  connected: boolean;
  deviceName: string | null;
  volume: number;
  maxVolume: number;
  muted: boolean;
  bass: number;
  treble: number;
  bassSupported: boolean;
  trebleSupported: boolean;
}

export interface BtAudioPlugin {
  getState(): Promise<SpeakerState>;
  requestBluetoothName(): Promise<SpeakerState>;
  setVolume(options: { level: number }): Promise<SpeakerState>;
  adjustVolume(options: { direction: "up" | "down" }): Promise<SpeakerState>;
  setMuted(options: { muted: boolean }): Promise<SpeakerState>;
  mediaKey(options: { key: "next" | "previous" }): Promise<void>;
  setBass(options: { level: number }): Promise<SpeakerState>;
  setTreble(options: { level: number }): Promise<SpeakerState>;
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
  bass: 50,
  treble: 50,
  bassSupported: false,
  trebleSupported: false,
};
