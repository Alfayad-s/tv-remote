import { nextBackoffMs, shouldRetry } from "@tv-remote/shared";

export interface ReconnectScheduler {
  schedule(run: () => void): boolean;
  reset(): void;
  stop(): void;
  getAttempt(): number;
}

export function createReconnectScheduler(): ReconnectScheduler {
  let attempt = 0;
  let timer: number | undefined;

  return {
    schedule(run) {
      if (!shouldRetry(attempt)) {
        return false;
      }
      const delay = nextBackoffMs({ attempt });
      attempt += 1;
      timer = window.setTimeout(run, delay);
      return true;
    },
    reset() {
      attempt = 0;
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    },
    stop() {
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    },
    getAttempt() {
      return attempt;
    },
  };
}
