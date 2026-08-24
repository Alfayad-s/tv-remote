import type { ConnectionState } from "@tv-remote/shared";
import type { ServiceStatus } from "../utils/labels.js";

const COLOR: Record<ConnectionState | ServiceStatus, string> = {
  DISCONNECTED: "bg-slate-500",
  CONNECTING: "bg-warn animate-pulse",
  CONNECTED: "bg-ok",
  PAIRING: "bg-warn animate-pulse",
  RECONNECTING: "bg-warn animate-pulse",
  ERROR: "bg-danger",
  connecting: "bg-warn animate-pulse",
  open: "bg-ok",
  closed: "bg-danger",
};

export function StatusDot({ state }: { state: ConnectionState | ServiceStatus }) {
  return (
    <span className={`inline-block size-2.5 rounded-full ${COLOR[state]}`} aria-hidden="true" />
  );
}
