export const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

const HOSTNAME_PATTERN =
  /^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\.?$/;

export interface ParsedTvTarget {
  host: string;
  port?: number;
}

export function isValidIpv4(value: string): boolean {
  return IPV4_PATTERN.test(value);
}

export function isValidHostname(value: string): boolean {
  if (value === "localhost") {
    return true;
  }
  return HOSTNAME_PATTERN.test(value);
}

export function parseTvTarget(raw: string): ParsedTvTarget | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.includes("://") || /\s/.test(trimmed)) {
    return null;
  }

  const [hostPart, portPart, extra] = trimmed.split(":");
  if (extra !== undefined || hostPart === undefined || hostPart.length === 0) {
    return null;
  }

  let port: number | undefined;
  if (portPart !== undefined) {
    if (!/^\d+$/.test(portPart)) {
      return null;
    }
    port = Number.parseInt(portPart, 10);
    if (port < 1 || port > 65535) {
      return null;
    }
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostPart)) {
    if (!isValidIpv4(hostPart)) {
      return null;
    }
  } else if (!isValidHostname(hostPart)) {
    return null;
  }

  return port === undefined ? { host: hostPart } : { host: hostPart, port };
}

export function isValidTvHost(value: string): boolean {
  return parseTvTarget(value) !== null;
}
