import { AppError } from "../types/errors.js";

const CLOUD_ENV_KEYS = [
  "RENDER",
  "RENDER_SERVICE_ID",
  "FLY_APP_NAME",
  "RAILWAY_ENVIRONMENT",
  "K_SERVICE",
  "DYNO",
] as const;

export function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) {
    return false;
  }
  const octets = parts.map((part) => Number.parseInt(part, 10));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  const [a, b] = octets;
  if (a === undefined || b === undefined) {
    return false;
  }
  if (a === 10) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  return false;
}

export function isCloudRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env["TV_REMOTE_CLOUD"] === "true") {
    return true;
  }
  return CLOUD_ENV_KEYS.some((key) => Boolean(env[key]));
}

export function cloudLanConnectError(host: string): AppError {
  return new AppError(
    "CONNECTION_FAILED",
    `This server cannot reach ${host} on your home Wi-Fi. Run the Node service on a computer on the same network as the TV, then point the app at that service.`,
  );
}
