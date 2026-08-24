export const CONNECTION_STATES = [
  "DISCONNECTED",
  "CONNECTING",
  "CONNECTED",
  "PAIRING",
  "RECONNECTING",
  "ERROR",
] as const;

export type ConnectionState = (typeof CONNECTION_STATES)[number];

export const TV_EVENTS = [
  "DISCOVERED",
  "CONNECTING",
  "CONNECTED",
  "DISCONNECTED",
  "PAIRING",
  "PAIRED",
  "RECONNECTING",
  "COMMAND_SENT",
  "ERROR",
] as const;

export type TVEvent = (typeof TV_EVENTS)[number];

const CONNECTION_STATE_SET = new Set<string>(CONNECTION_STATES);

export function isConnectionState(value: unknown): value is ConnectionState {
  return typeof value === "string" && CONNECTION_STATE_SET.has(value);
}
