export const STREAMDESK_DEFAULT_PORT = 8790;
export const STREAMDESK_SERVICE_TYPE = "streamdesk";

export interface DeskApp {
  /** Stable id — prefer bundle id when known, else app name. */
  id: string;
  name: string;
  bundleId: string | null;
  running: boolean;
  /** Absolute HTTP URL to a PNG icon when the desk agent serves one. */
  iconUrl: string | null;
  /** Position in the Mac-arranged desk list; null if not on the desk. */
  order: number | null;
}

export type ClientMessage =
  | { type: "PAIR"; id: string; pin: string; deviceName?: string }
  | { type: "AUTH"; id: string; token: string }
  | { type: "LIST_APPS"; id: string }
  | { type: "LAUNCH"; id: string; appId: string }
  | { type: "ACTIVATE"; id: string; appId: string }
  | { type: "QUIT"; id: string; appId: string }
  | { type: "PING"; id: string };

export type ServerMessage =
  | {
      type: "HELLO";
      id: string;
      payload: { hostName: string; port: number; needsPairing: boolean };
    }
  | {
      type: "PAIR_RESULT";
      id: string;
      payload: { ok: boolean; token?: string; message?: string };
    }
  | {
      type: "AUTH_RESULT";
      id: string;
      payload: { ok: boolean; message?: string };
    }
  | {
      type: "APP_LIST";
      id: string;
      payload: {
        /** Apps arranged on the Mac desk — this is what the phone should show first. */
        desk: DeskApp[];
        apps: DeskApp[];
        running: DeskApp[];
      };
    }
  | {
      type: "COMMAND_ACK";
      id: string;
      payload: { ok: boolean; action: string; appId: string; message?: string };
    }
  | {
      type: "APP_EVENT";
      id: string;
      payload: { event: "launched" | "quit"; app: DeskApp };
    }
  | { type: "PONG"; id: string }
  | { type: "ERROR"; id: string; payload: { message: string } };

export function isClientMessage(value: unknown): value is ClientMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return (
    type === "PAIR" ||
    type === "AUTH" ||
    type === "LIST_APPS" ||
    type === "LAUNCH" ||
    type === "ACTIVATE" ||
    type === "QUIT" ||
    type === "PING"
  );
}
