import { useEffect, useRef, useState } from "react";
import { Button } from "../../components/Button.js";
import { StatusDot } from "../../components/StatusDot.js";
import { ConnectButton } from "../connection/ConnectButton.js";
import { ConnectionStatus } from "../connection/ConnectionStatus.js";
import { PairingForm } from "../pairing/PairingForm.js";
import { ManualIpForm } from "../tv/ManualIpForm.js";
import { TvList } from "../tv/TvList.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { serviceStatusLabel } from "../../utils/labels.js";
import { KeyboardPanel } from "./KeyboardPanel.js";
import { RemotePad } from "./RemotePad.js";
import { TouchPad } from "./TouchPad.js";

type RemotePanel = "remote" | "touchpad" | "keyboard";

export function RemoteScreen() {
  const { serviceStatus, tvState, lastError, lastCommand, discoverTvs, discoveryStatus, imeActive } =
    useConnection();
  const haptic = useHaptics();
  const [panel, setPanel] = useState<RemotePanel>("remote");
  const wasImeActive = useRef(false);
  const canSend = tvState === "CONNECTED";

  useEffect(() => {
    if (imeActive && !wasImeActive.current && tvState === "CONNECTED") {
      haptic();
      setPanel("keyboard");
    }
    wasImeActive.current = imeActive;
  }, [haptic, imeActive, tvState]);

  return (
    <main className="flex flex-1 flex-col gap-5">
      <header className="pt-2">
        <p className="text-xs uppercase tracking-[0.28em] text-accent/80">Personal remote</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">iFFALCON Remote</h1>
      </header>

      <ConnectionStatus />

      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink-soft/80 px-4 py-3 text-sm text-cyan-100/70">
        <StatusDot state={serviceStatus} />
        <span>{serviceStatusLabel(serviceStatus)}</span>
      </div>

      {lastError ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-rose-100">
          {lastError}
        </p>
      ) : null}

      {tvState === "CONNECTED" ? (
        <>
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-line bg-ink-soft/70 p-1">
            {(
              [
                ["remote", "Remote"],
                ["touchpad", "Touchpad"],
                ["keyboard", "Keyboard"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`min-h-11 rounded-xl text-sm font-semibold ${
                  panel === id ? "bg-accent-strong text-ink" : "text-cyan-100/70"
                }`}
                onClick={() => {
                  haptic();
                  setPanel(id);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {panel === "remote" ? (
            <RemotePad disabled={!canSend} />
          ) : panel === "touchpad" ? (
            <TouchPad disabled={!canSend} />
          ) : (
            <KeyboardPanel disabled={!canSend} />
          )}
          <ConnectButton />
        </>
      ) : (
        <>
          <TvList />

          {tvState !== "PAIRING" ? (
            <Button
              variant="ghost"
              disabled={serviceStatus !== "open" || discoveryStatus === "searching"}
              onClick={() => {
                haptic();
                discoverTvs();
              }}
            >
              {discoveryStatus === "searching" ? "Scanning network…" : "Scan again"}
            </Button>
          ) : null}

          <ManualIpForm />
          <ConnectButton />
          <PairingForm />
        </>
      )}

      <p className="mt-auto text-center text-xs text-cyan-100/40">
        {lastCommand
          ? `Last command: ${lastCommand}`
          : tvState === "PAIRING"
            ? "Enter the code shown on the TV to finish pairing."
            : tvState === "CONNECTED"
              ? panel === "touchpad"
                ? "Swipe to move focus. Tap to select."
                : panel === "keyboard"
                  ? "Type on the phone. Text goes to the TV automatically."
                  : "Hold arrows or volume to repeat."
            : tvState === "CONNECTING" || tvState === "RECONNECTING"
              ? "The TV and the Node service must be on the same Wi-Fi. A cloud host cannot reach 192.168.x.x."
              : "Connect the TV to use the remote."}
      </p>
    </main>
  );
}
