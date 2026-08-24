import type { RemoteCommand } from "@tv-remote/shared";

/**
 * Android TV Remote v2 KeyEvent codes from remotemessage.proto.
 * Mapping a command here means the protocol can carry it, not that it is
 * confirmed on the physical iFFALCON.
 */
export const ANDROID_TV_KEY_CODES: Record<RemoteCommand, number> = {
  POWER: 26,
  HOME: 3,
  BACK: 4,
  UP: 19,
  DOWN: 20,
  LEFT: 21,
  RIGHT: 22,
  OK: 23,
  VOLUME_UP: 24,
  VOLUME_DOWN: 25,
  MUTE: 164,
  PLAY_PAUSE: 85,
  PREVIOUS: 88,
  NEXT: 87,
  REWIND: 89,
  FAST_FORWARD: 90,
  CHANNEL_UP: 166,
  CHANNEL_DOWN: 167,
  BACKSPACE: 67,
  ENTER: 66,
};

export function toAndroidKeyCode(command: RemoteCommand): number {
  return ANDROID_TV_KEY_CODES[command];
}
