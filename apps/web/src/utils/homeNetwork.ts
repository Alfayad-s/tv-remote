import { parseTvTarget } from "@tv-remote/shared";

export const HOME_COMPUTER_STORAGE_KEY = "tv-remote.home-computer";
export const DEFAULT_HOME_PAGE_PORT = 5173;

export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".local")) {
    return true;
  }
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

const CLOUD_WS_HOST_PATTERN =
  /onrender\.com|railway\.app|fly\.dev|\.herokuapp\.com|koyeb\.app/i;

export function usesCloudBackend(wsUrl = ""): boolean {
  return CLOUD_WS_HOST_PATTERN.test(wsUrl);
}

export function buildHomeRemoteUrl(
  raw: string,
  defaultPort = DEFAULT_HOME_PAGE_PORT,
): string | null {
  const parsed = parseTvTarget(raw);
  if (!parsed) {
    return null;
  }
  const port = parsed.port ?? defaultPort;
  return `http://${parsed.host}:${port}/`;
}

export function readStoredHomeComputer(): string {
  try {
    return window.localStorage.getItem(HOME_COMPUTER_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function storeHomeComputer(value: string): void {
  try {
    window.localStorage.setItem(HOME_COMPUTER_STORAGE_KEY, value);
  } catch {
    // Private mode can reject localStorage.
  }
}
