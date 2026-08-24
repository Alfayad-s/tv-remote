import type { LogLevel } from "../logger.js";

export type TvAdapterName = "mock" | "androidtv";
export type DiscoveryMode = "auto" | "mdns" | "mock";

export interface ServerConfig {
  host: string;
  port: number;
  logLevel: LogLevel;
  adapter: TvAdapterName;
  discoveryMode: DiscoveryMode;
  discoveryTimeoutMs: number;
  pairingTimeoutMs: number;
  pairingClientName: string;
  credentialsDir: string;
  allowedOrigins: string[];
}

const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];
const ADAPTERS: readonly TvAdapterName[] = ["mock", "androidtv"];
const DISCOVERY_MODES: readonly DiscoveryMode[] = ["auto", "mdns", "mock"];

function readEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return parsed;
}

function readTimeout(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 500 || parsed > 15_000) {
    throw new Error(`Invalid DISCOVERY_TIMEOUT_MS: ${value}`);
  }
  return parsed;
}

function readPairingTimeout(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 10_000 || parsed > 180_000) {
    throw new Error(`Invalid PAIRING_TIMEOUT_MS: ${value}`);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const allowedOrigins = (env["WS_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    host: env["HOST"] ?? "0.0.0.0",
    port: readPort(env["PORT"], 8787),
    logLevel: readEnum(env["LOG_LEVEL"], LOG_LEVELS, "info"),
    adapter: readEnum(env["TV_ADAPTER"], ADAPTERS, "mock"),
    discoveryMode: readEnum(env["DISCOVERY_MODE"], DISCOVERY_MODES, "auto"),
    discoveryTimeoutMs: readTimeout(env["DISCOVERY_TIMEOUT_MS"], 3000),
    pairingTimeoutMs: readPairingTimeout(env["PAIRING_TIMEOUT_MS"], 90_000),
    pairingClientName: env["PAIRING_CLIENT_NAME"]?.trim() || "iFFALCON Remote",
    credentialsDir: env["CREDENTIALS_DIR"] ?? "./data/credentials",
    allowedOrigins,
  };
}
