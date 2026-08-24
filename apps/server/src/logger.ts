export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

const SENSITIVE_KEYS = new Set([
  "pin",
  "secret",
  "cert",
  "key",
  "certificate",
  "privatekey",
  "certpem",
  "keypem",
  "pairingpin",
  "pairingcode",
]);

function redact(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    sanitized[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[redacted]" : value;
  }
  return sanitized;
}

export function createLogger(level: LogLevel): Logger {
  const minRank = LEVEL_RANK[level];

  const write = (
    entryLevel: LogLevel,
    message: string,
    context?: Record<string, unknown>,
  ): void => {
    if (LEVEL_RANK[entryLevel] < minRank) {
      return;
    }

    const line = {
      timestamp: new Date().toISOString(),
      level: entryLevel.toUpperCase(),
      message,
      ...(redact(context) ?? {}),
    };

    const serialized = JSON.stringify(line);
    if (entryLevel === "error") {
      console.error(serialized);
      return;
    }
    if (entryLevel === "warn") {
      console.warn(serialized);
      return;
    }
    console.log(serialized);
  };

  return {
    debug: (message, context) => {
      write("debug", message, context);
    },
    info: (message, context) => {
      write("info", message, context);
    },
    warn: (message, context) => {
      write("warn", message, context);
    },
    error: (message, context) => {
      write("error", message, context);
    },
  };
}
