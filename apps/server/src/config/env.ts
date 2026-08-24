import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import type { LogLevel } from "../logger.js";

export type TvAdapterName = "mock" | "androidtv";
export type DiscoveryMode = "auto" | "mdns" | "mock";

export interface ServerConfig {
  host: string;
  port: number;
  logLevel: LogLevel;
  adapter: TvAdapterName;
  discoveryMode: DiscoveryMode;
  includeMock: boolean;
  discoveryTimeoutMs: number;
  pairingTimeoutMs: number;
  pairingClientName: string;
  credentialsDir: string;
  allowedOrigins: string[];
  webDist: string | null;
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

function readIncludeMock(env: NodeJS.ProcessEnv): boolean {
  const raw = env["INCLUDE_MOCK"]?.trim().toLowerCase();
  if (raw === "true" || raw === "1") {
    return true;
  }
  if (raw === "false" || raw === "0") {
    return false;
  }
  return env["NODE_ENV"] !== "production";
}

export function resolveWebDist(
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): string | null {
  const raw = env["WEB_DIST"]?.trim();
  if (raw === "false" || raw === "0" || raw === "off") {
    return null;
  }

  const candidates =
    raw && raw.length > 0
      ? [resolve(cwd, raw)]
      : [
          resolve(cwd, "apps/web/dist"),
          resolve(cwd, "../web/dist"),
          resolve(cwd, "../../apps/web/dist"),
        ];

  for (const dir of candidates) {
    if (existsSync(join(dir, "index.html"))) {
      return dir;
    }
  }

  return null;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const allowedOrigins = (env["WS_ALLOWED_ORIGINS"] ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const production = env["NODE_ENV"] === "production";

  return {
    host: env["HOST"] ?? "0.0.0.0",
    port: readPort(env["PORT"], 8787),
    logLevel: readEnum(env["LOG_LEVEL"], LOG_LEVELS, "info"),
    adapter: readEnum(env["TV_ADAPTER"], ADAPTERS, production ? "androidtv" : "mock"),
    discoveryMode: readEnum(env["DISCOVERY_MODE"], DISCOVERY_MODES, production ? "mdns" : "auto"),
    includeMock: readIncludeMock(env),
    discoveryTimeoutMs: readTimeout(env["DISCOVERY_TIMEOUT_MS"], 3000),
    pairingTimeoutMs: readPairingTimeout(env["PAIRING_TIMEOUT_MS"], 90_000),
    pairingClientName: env["PAIRING_CLIENT_NAME"]?.trim() || "iFFALCON Remote",
    credentialsDir: env["CREDENTIALS_DIR"] ?? "./data/credentials",
    allowedOrigins,
    webDist: resolveWebDist(env),
  };
}
