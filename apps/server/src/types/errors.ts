import type { AppErrorCode } from "@tv-remote/shared";
import { ERROR_USER_MESSAGES } from "@tv-remote/shared";

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message?: string) {
    super(message ?? ERROR_USER_MESSAGES[code]);
    this.name = "AppError";
    this.code = code;
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError("INTERNAL_ERROR");
}

export function isCancelledError(error: unknown): boolean {
  return error instanceof AppError && error.message === "Connection cancelled.";
}
