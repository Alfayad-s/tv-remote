export const APP_ERROR_CODES = [
  "TV_NOT_FOUND",
  "TV_OFFLINE",
  "PAIRING_REQUIRED",
  "PAIRING_FAILED",
  "INVALID_PIN",
  "CONNECTION_FAILED",
  "CONNECTION_TIMEOUT",
  "AUTHENTICATION_FAILED",
  "UNSUPPORTED_DEVICE",
  "PROTOCOL_ERROR",
  "INVALID_MESSAGE",
  "UNKNOWN_COMMAND",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export const ERROR_USER_MESSAGES: Record<AppErrorCode, string> = {
  TV_NOT_FOUND: "No TV was found on the local network.",
  TV_OFFLINE: "The TV is unavailable. Check that it is on and connected to Wi-Fi.",
  PAIRING_REQUIRED: "This TV needs to be paired before it can be controlled.",
  PAIRING_FAILED: "Pairing did not complete. Please try again.",
  INVALID_PIN: "That PIN did not match. Check the code on the TV and try again.",
  CONNECTION_FAILED: "Could not connect to the TV.",
  CONNECTION_TIMEOUT: "The TV did not respond in time.",
  AUTHENTICATION_FAILED: "The saved pairing is no longer valid. Pair the TV again.",
  UNSUPPORTED_DEVICE: "This device is not supported yet.",
  PROTOCOL_ERROR: "The TV sent an unexpected response.",
  INVALID_MESSAGE: "The app sent a message the service could not understand.",
  UNKNOWN_COMMAND: "That remote command is not recognized.",
  SERVICE_UNAVAILABLE: "The local remote service is not running.",
  INTERNAL_ERROR: "Something went wrong. Try again in a moment.",
};

const APP_ERROR_CODE_SET = new Set<string>(APP_ERROR_CODES);

export function isAppErrorCode(value: unknown): value is AppErrorCode {
  return typeof value === "string" && APP_ERROR_CODE_SET.has(value);
}

export function toUserErrorMessage(code: AppErrorCode, fallback?: string): string {
  return fallback ?? ERROR_USER_MESSAGES[code];
}
