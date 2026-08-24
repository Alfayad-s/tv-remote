import { DEFAULT_RECONNECT } from "./types.js";

export interface BackoffOptions {
  initialMs?: number;
  maxMs?: number;
  attempt: number;
}

export function nextBackoffMs(options: BackoffOptions): number {
  const initialMs = options.initialMs ?? DEFAULT_RECONNECT.initialMs;
  const maxMs = options.maxMs ?? DEFAULT_RECONNECT.maxMs;
  const exponent = Math.max(0, options.attempt);
  return Math.min(initialMs * 2 ** exponent, maxMs);
}

export function shouldRetry(attempt: number, maxAttempts = DEFAULT_RECONNECT.maxAttempts): boolean {
  return attempt < maxAttempts;
}
