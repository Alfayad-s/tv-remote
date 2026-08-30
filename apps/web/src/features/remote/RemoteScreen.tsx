import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "../../components/Button.js";
import { StatusDot } from "../../components/StatusDot.js";
import { ConnectButton } from "../connection/ConnectButton.js";
import { ConnectionStatus } from "../connection/ConnectionStatus.js";
import { HomeNetworkCard } from "../connection/HomeNetworkCard.js";
import { PairingForm } from "../pairing/PairingForm.js";
import { ManualIpForm } from "../tv/ManualIpForm.js";
import { TvList } from "../tv/TvList.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { DownloadAppButton } from "../landing/DownloadAppButton.js";
import { isNativeAndroid } from "../../native/platform.js";
import {
  needsWifiConnectionHelp,
  serviceStatusLabel,
  tvStateLabel,
  WIFI_CONNECTION_HELP,
} from "../../utils/labels.js";
import { KeyboardComposer } from "./KeyboardPanel.js";
import { RemotePad } from "./RemotePad.js";
import { IconTabRemote, IconTabTouchpad } from "./remoteIcons.js";
import { TouchPad } from "./TouchPad.js";

type RemotePanel = "remote" | "touchpad";

const PANELS: { id: RemotePanel; label: string; icon: () => ReactNode }[] = [
  { id: "remote", label: "Remote", icon: IconTabRemote },
  { id: "touchpad", label: "Touchpad", icon: IconTabTouchpad },
];

function ConnectedHint({ panel, lastCommand }: { panel: RemotePanel; lastCommand: string | null }) {
  if (lastCommand) {
    return <>Last command: {lastCommand}</>;
  }
  if (panel === "touchpad") {
    return <>Swipe to move focus. Tap to select.</>;
  }
  return <>Hold arrows or volume to repeat.</>;
}

export function RemoteScreen() {
  const {
    serviceStatus,
    tv,
    tvState,
    lastError,
    lastCommand,
    discoverTvs,
    discoveryStatus,
  } = useConnection();
  const haptic = useHaptics();
  const [panel, setPanel] = useState<RemotePanel>("remote");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const wasConnected = useRef(false);
  const canSend = tvState === "CONNECTED";
  const showRemote =
    tvState === "CONNECTED" ||
    tvState === "CONNECTING" ||
    tvState === "RECONNECTING" ||
    (tvState === "ERROR" && tv !== null);

  useEffect(() => {
    if (tvState === "CONNECTING" || (tvState === "CONNECTED" && !wasConnected.current)) {
      setPanel("remote");
    }
    wasConnected.current = tvState === "CONNECTED";
  }, [tvState]);

  const openKeyboard = (): void => {
    haptic();
    setKeyboardOpen(true);
    previewInputRef.current?.focus();
  };

  const closeKeyboard = (): void => {
    haptic();
    previewInputRef.current?.blur();
    setKeyboardOpen(false);
  };

  if (showRemote) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-5">
        <div className="mt-1 grid shrink-0 grid-cols-2 overflow-hidden border-4 border-ink">
          {PANELS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex min-h-11 items-center justify-center gap-2 border-ink px-1 text-[15px] font-bold uppercase ${
                  item.id === "touchpad" ? "border-l-4" : ""
                } ${panel === item.id ? "bg-accent-strong" : "bg-paper"}`}
                onClick={() => {
                  haptic();
                  setPanel(item.id);
                }}
              >
                <Icon />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <StatusDot state={tvState} />
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] uppercase leading-none">
                {tv?.name ?? "Android TV"}
              </p>
              <p className="mt-1 font-mono text-[10.5px] tracking-wide text-ink/60" data-testid="tv-status">
                TV: {tvStateLabel(tvState)}
              </p>
            </div>
          </div>
          <ConnectButton compact />
        </div>

        {needsWifiConnectionHelp(tvState) ? (
          <p className="mt-3 shrink-0 border-4 border-ink bg-coral px-3 py-2 text-sm font-bold text-ink">
            {WIFI_CONNECTION_HELP}
          </p>
        ) : lastError ? (
          <p className="mt-3 shrink-0 border-4 border-ink bg-coral px-3 py-2 text-sm font-bold text-ink">
            {lastError}
          </p>
        ) : null}

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
          {panel === "remote" ? (
            <RemotePad disabled={!canSend} onOpenKeyboard={openKeyboard} />
          ) : (
            <TouchPad disabled={!canSend} fill onOpenKeyboard={openKeyboard} />
          )}
        </div>

        {keyboardOpen ? null : (
          <div className="mt-4 hidden shrink-0 flex-col items-center gap-3 pb-3 min-[400px]:flex [@media(orientation:landscape)_and_(max-height:560px)]:hidden">
            <p className="min-w-[12.5rem] bg-ink px-3.5 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-accent-strong">
              <ConnectedHint panel={panel} lastCommand={lastCommand} />
            </p>
            <div className="h-1.5 w-[70px] bg-ink" />
          </div>
        )}

        <KeyboardComposer
          disabled={!canSend}
          open={keyboardOpen}
          inputRef={previewInputRef}
          onClose={closeKeyboard}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-5">
      <header className="shrink-0 pt-2">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em]">Personal remote</p>
        <h1 className="mt-2 font-display text-[clamp(1.6rem,7vw,2rem)] uppercase leading-none">
          TV Remote
        </h1>
      </header>

      {!isNativeAndroid() ? <DownloadAppButton /> : null}

      <ConnectionStatus />

      <div className="flex items-center gap-2 border-4 border-ink bg-paper px-4 py-3 text-sm font-bold">
        <StatusDot state={serviceStatus} />
        <span>{serviceStatusLabel(serviceStatus, isNativeAndroid() ? "native" : "web")}</span>
      </div>

      {!isNativeAndroid() ? <HomeNetworkCard /> : null}

      {needsWifiConnectionHelp(tvState) ? (
        <p className="border-4 border-ink bg-coral px-4 py-3 text-sm font-bold">
          {WIFI_CONNECTION_HELP}
        </p>
      ) : lastError ? (
        <p className="border-4 border-ink bg-coral px-4 py-3 text-sm font-bold">
          {lastError}
        </p>
      ) : null}

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

      <p className="mt-auto text-center font-mono text-[11px] font-bold uppercase tracking-wide text-ink/55">
        {tvState === "PAIRING"
          ? "Enter the code shown on the TV to finish pairing."
          : "Connect the TV to use the remote."}
      </p>
    </main>
  );
}
