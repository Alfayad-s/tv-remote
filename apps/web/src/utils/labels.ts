import type { ConnectionState } from "@tv-remote/shared";

export type ServiceStatus = "connecting" | "open" | "closed";

export function tvStateLabel(state: ConnectionState): string {
  switch (state) {
    case "DISCONNECTED":
      return "Not connected";
    case "CONNECTING":
      return "Connecting…";
    case "CONNECTED":
      return "Connected";
    case "PAIRING":
      return "Pairing…";
    case "RECONNECTING":
    case "ERROR":
      return "Check connection";
  }
}

export const WIFI_CONNECTION_HELP =
  "Check the connection. The TV and phone must be on the same Wi‑Fi.";

export function needsWifiConnectionHelp(state: ConnectionState): boolean {
  return state === "CONNECTING" || state === "RECONNECTING" || state === "ERROR";
}

export function serviceStatusLabel(
  status: ServiceStatus,
  runtime: "web" | "native" = "web",
): string {
  if (runtime === "native") {
    switch (status) {
      case "connecting":
        return "Starting phone remote…";
      case "open":
        return "Phone ready — laptop not required";
      case "closed":
        return "Native remote unavailable";
    }
  }
  switch (status) {
    case "connecting":
      return "Connecting to local service…";
    case "open":
      return "Local service online";
    case "closed":
      return "Local service unavailable";
  }
}
