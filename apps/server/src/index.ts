import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "./config/index.js";
import { createDiscoveryService } from "./discovery/createDiscovery.js";
import { createLogger } from "./logger.js";
import { FileCredentialStore } from "./storage/FileCredentialStore.js";
import { createAdapter } from "./tv/adapters/createAdapter.js";
import { TVManager } from "./tv/TVManager.js";
import { createWebSocketServer } from "./websocket/server.js";

function applyEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

applyEnvFile(resolve(process.cwd(), ".env"));
applyEnvFile(resolve(process.cwd(), "../../.env"));

const config = loadConfig();
const logger = createLogger(config.logLevel);
const adapter = createAdapter({
  name: config.adapter,
  credentials: new FileCredentialStore(config.credentialsDir),
  pairingTimeoutMs: config.pairingTimeoutMs,
  pairingClientName: config.pairingClientName,
});
const tvManager = new TVManager(adapter, logger);
const discovery = createDiscoveryService({
  mode: config.discoveryMode,
  adapter: config.adapter,
  timeoutMs: config.discoveryTimeoutMs,
  logger,
});

const wss = createWebSocketServer({
  config,
  logger,
  tvManager,
  discovery,
});

const shutdown = (): void => {
  logger.info("Shutting down");
  discovery.stop?.();
  wss.close();
  void tvManager.disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
