export const REMOTE_COMMANDS = [
  "POWER",
  "HOME",
  "BACK",
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "OK",
  "VOLUME_UP",
  "VOLUME_DOWN",
  "MUTE",
  "PLAY_PAUSE",
  "PREVIOUS",
  "NEXT",
  "REWIND",
  "FAST_FORWARD",
  "CHANNEL_UP",
  "CHANNEL_DOWN",
  "BACKSPACE",
  "ENTER",
] as const;

export type RemoteCommand = (typeof REMOTE_COMMANDS)[number];

const REMOTE_COMMAND_SET = new Set<string>(REMOTE_COMMANDS);

export function isRemoteCommand(value: unknown): value is RemoteCommand {
  return typeof value === "string" && REMOTE_COMMAND_SET.has(value);
}
