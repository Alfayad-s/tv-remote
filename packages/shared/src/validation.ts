import { isTvAppId } from "./apps.js";
import { isRemoteCommand } from "./commands.js";
import { isAppErrorCode } from "./errors.js";
import { isConnectionState, TV_EVENTS, type TVEvent } from "./events.js";
import {
  CLIENT_MESSAGE_TYPES,
  SERVER_MESSAGE_TYPES,
  type ClientMessage,
  type ServerMessage,
} from "./messages.js";
import type { AppErrorCode } from "./errors.js";
import { parseTvTarget } from "./hosts.js";
import { normalizePairingPin } from "./pin.js";
import { normalizeSendText } from "./text.js";
import { ANDROID_TV_MDNS_TYPES, TV_DEVICE_SOURCES, type TVDevice } from "./types.js";

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  code: AppErrorCode;
  message: string;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

function fail(code: AppErrorCode, message: string): ValidationFailure {
  return { ok: false, code, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function parseJson(raw: string): ValidationResult<unknown> {
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return fail("INVALID_MESSAGE", "Message is not valid JSON.");
  }
}

function readEnvelope(value: unknown): ValidationResult<{
  id: string;
  type: string;
  payload: Record<string, unknown>;
}> {
  if (!isRecord(value)) {
    return fail("INVALID_MESSAGE", "Message must be an object.");
  }

  if (!isNonEmptyString(value["id"])) {
    return fail("INVALID_MESSAGE", "Message id must be a non-empty string.");
  }

  if (!isNonEmptyString(value["type"])) {
    return fail("INVALID_MESSAGE", "Message type must be a non-empty string.");
  }

  const payload = value["payload"];
  if (!isRecord(payload)) {
    return fail("INVALID_MESSAGE", "Message payload must be an object.");
  }

  return { ok: true, value: { id: value["id"], type: value["type"], payload } };
}

function isTvDevice(value: unknown): value is TVDevice {
  if (!isRecord(value)) {
    return false;
  }

  const source = value["source"];
  const serviceType = value["serviceType"];

  return (
    isNonEmptyString(value["id"]) &&
    isNonEmptyString(value["name"]) &&
    isNonEmptyString(value["host"]) &&
    (value["port"] === undefined || typeof value["port"] === "number") &&
    (value["brand"] === undefined || typeof value["brand"] === "string") &&
    (value["model"] === undefined || typeof value["model"] === "string") &&
    typeof value["connected"] === "boolean" &&
    (source === undefined || (typeof source === "string" && SOURCE_SET.has(source))) &&
    (serviceType === undefined ||
      (typeof serviceType === "string" && SERVICE_TYPE_SET.has(serviceType)))
  );
}

const CLIENT_TYPE_SET = new Set<string>(CLIENT_MESSAGE_TYPES);
const SERVER_TYPE_SET = new Set<string>(SERVER_MESSAGE_TYPES);
const TV_EVENT_SET = new Set<string>(TV_EVENTS);
const SOURCE_SET = new Set<string>(TV_DEVICE_SOURCES);
const SERVICE_TYPE_SET = new Set<string>(ANDROID_TV_MDNS_TYPES);

export function validateClientMessage(raw: unknown): ValidationResult<ClientMessage> {
  const parsed = typeof raw === "string" ? parseJson(raw) : { ok: true as const, value: raw };
  if (!parsed.ok) {
    return parsed;
  }

  const envelope = readEnvelope(parsed.value);
  if (!envelope.ok) {
    return envelope;
  }

  const { id, type, payload } = envelope.value;

  if (!CLIENT_TYPE_SET.has(type)) {
    return fail("INVALID_MESSAGE", `Unknown client message type: ${type}`);
  }

  switch (type) {
    case "CONNECT_TV": {
      if (!optionalString(payload["id"])) {
        return fail("INVALID_MESSAGE", "CONNECT_TV id must be a string when provided.");
      }

      let host: string | undefined;
      let port: number | undefined;

      if (payload["host"] !== undefined) {
        if (typeof payload["host"] !== "string") {
          return fail("INVALID_MESSAGE", "CONNECT_TV host must be a string when provided.");
        }
        const parsedHost = parseTvTarget(payload["host"]);
        if (!parsedHost) {
          return fail("INVALID_MESSAGE", "CONNECT_TV host must be an IPv4 address or hostname.");
        }
        host = parsedHost.host;
        port = parsedHost.port;
      }

      if (payload["port"] !== undefined) {
        if (
          typeof payload["port"] !== "number" ||
          !Number.isInteger(payload["port"]) ||
          payload["port"] < 1 ||
          payload["port"] > 65535
        ) {
          return fail("INVALID_MESSAGE", "CONNECT_TV port must be an integer from 1 to 65535.");
        }
        port = payload["port"];
      }

      return {
        ok: true,
        value: {
          id,
          type,
          payload: {
            ...(payload["id"] === undefined ? {} : { id: payload["id"] }),
            ...(host === undefined ? {} : { host }),
            ...(port === undefined ? {} : { port }),
          },
        },
      };
    }
    case "DISCONNECT_TV":
    case "DISCOVER_TVS":
      return { ok: true, value: { id, type, payload: {} } };
    case "REMOTE_COMMAND": {
      if (!isRemoteCommand(payload["command"])) {
        return fail("UNKNOWN_COMMAND", "REMOTE_COMMAND requires a supported command.");
      }
      return { ok: true, value: { id, type, payload: { command: payload["command"] } } };
    }
    case "SEND_TEXT": {
      const text = normalizeSendText(payload["text"]);
      if (text === null) {
        return fail("INVALID_MESSAGE", "SEND_TEXT requires 1–256 characters.");
      }
      return { ok: true, value: { id, type, payload: { text } } };
    }
    case "LAUNCH_APP": {
      if (!isTvAppId(payload["app"])) {
        return fail("INVALID_MESSAGE", "LAUNCH_APP requires a supported app.");
      }
      return { ok: true, value: { id, type, payload: { app: payload["app"] } } };
    }
    case "SUBMIT_PIN": {
      if (typeof payload["pin"] !== "string") {
        return fail("INVALID_PIN", "SUBMIT_PIN requires a pairing PIN.");
      }
      const pin = normalizePairingPin(payload["pin"]);
      if (!pin) {
        return fail("INVALID_PIN", "SUBMIT_PIN requires a 4–8 character hexadecimal PIN.");
      }
      return { ok: true, value: { id, type, payload: { pin } } };
    }
    case "PING": {
      if (typeof payload["timestamp"] !== "number" || !Number.isFinite(payload["timestamp"])) {
        return fail("INVALID_MESSAGE", "PING requires a numeric timestamp.");
      }
      return { ok: true, value: { id, type, payload: { timestamp: payload["timestamp"] } } };
    }
    default:
      return fail("INVALID_MESSAGE", `Unknown client message type: ${type}`);
  }
}

export function validateServerMessage(raw: unknown): ValidationResult<ServerMessage> {
  const parsed = typeof raw === "string" ? parseJson(raw) : { ok: true as const, value: raw };
  if (!parsed.ok) {
    return parsed;
  }

  const envelope = readEnvelope(parsed.value);
  if (!envelope.ok) {
    return envelope;
  }

  const { id, type, payload } = envelope.value;

  if (!SERVER_TYPE_SET.has(type)) {
    return fail("INVALID_MESSAGE", `Unknown server message type: ${type}`);
  }

  switch (type) {
    case "CONNECTION_STATE": {
      if (!isConnectionState(payload["state"])) {
        return fail("INVALID_MESSAGE", "CONNECTION_STATE requires a valid state.");
      }
      const tv = payload["tv"];
      if (tv !== null && !isTvDevice(tv)) {
        return fail("INVALID_MESSAGE", "CONNECTION_STATE tv must be a TV device or null.");
      }
      return { ok: true, value: { id, type, payload: { state: payload["state"], tv } } };
    }
    case "TV_EVENT": {
      if (typeof payload["event"] !== "string" || !TV_EVENT_SET.has(payload["event"])) {
        return fail("INVALID_MESSAGE", "TV_EVENT requires a valid event.");
      }
      const tv = payload["tv"];
      if (tv !== null && !isTvDevice(tv)) {
        return fail("INVALID_MESSAGE", "TV_EVENT tv must be a TV device or null.");
      }
      const command = payload["command"];
      if (command !== undefined && !isRemoteCommand(command)) {
        return fail("UNKNOWN_COMMAND", "TV_EVENT command is not recognized.");
      }
      return {
        ok: true,
        value: {
          id,
          type,
          payload: {
            event: payload["event"] as TVEvent,
            tv,
            ...(command === undefined ? {} : { command }),
          },
        },
      };
    }
    case "TV_LIST": {
      if (!Array.isArray(payload["devices"]) || !payload["devices"].every(isTvDevice)) {
        return fail("INVALID_MESSAGE", "TV_LIST devices must be an array of TV devices.");
      }
      return { ok: true, value: { id, type, payload: { devices: payload["devices"] } } };
    }
    case "ERROR": {
      if (!isAppErrorCode(payload["code"]) || typeof payload["message"] !== "string") {
        return fail("INVALID_MESSAGE", "ERROR requires a known code and message.");
      }
      return {
        ok: true,
        value: { id, type, payload: { code: payload["code"], message: payload["message"] } },
      };
    }
    case "PONG": {
      if (typeof payload["timestamp"] !== "number" || !Number.isFinite(payload["timestamp"])) {
        return fail("INVALID_MESSAGE", "PONG requires a numeric timestamp.");
      }
      return { ok: true, value: { id, type, payload: { timestamp: payload["timestamp"] } } };
    }
    case "COMMAND_ACK": {
      if (!isRemoteCommand(payload["command"]) || typeof payload["success"] !== "boolean") {
        return fail("INVALID_MESSAGE", "COMMAND_ACK requires a command and success flag.");
      }
      return {
        ok: true,
        value: {
          id,
          type,
          payload: { command: payload["command"], success: payload["success"] },
        },
      };
    }
    case "IME_STATE": {
      if (typeof payload["active"] !== "boolean") {
        return fail("INVALID_MESSAGE", "IME_STATE requires an active flag.");
      }
      return { ok: true, value: { id, type, payload: { active: payload["active"] } } };
    }
    default:
      return fail("INVALID_MESSAGE", `Unknown server message type: ${type}`);
  }
}
