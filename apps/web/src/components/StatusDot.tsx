import type { ConnectionState } from "@tv-remote/shared";
import type { ServiceStatus } from "../utils/labels.js";

const COLOR: Record<ConnectionState | ServiceStatus, string> = {
  DISCONNECTED: "bg-[#cfcac0]",
  CONNECTING: "bg-warn",
  CONNECTED: "bg-ok",
  PAIRING: "bg-warn",
  RECONNECTING: "bg-coral",
  ERROR: "bg-coral",
  connecting: "bg-warn",
  open: "bg-ok",
  closed: "bg-coral",
};

export function StatusDot({ state }: { state: ConnectionState | ServiceStatus }) {
  return (
    <span
      className={`inline-block size-3.5 shrink-0 rounded-full border-[3px] border-ink ${COLOR[state]}`}
      aria-hidden="true"
    />
  );
}
