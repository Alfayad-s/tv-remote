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
      return "Trying to reconnect…";
    case "ERROR":
      return "Connection error";
  }
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
