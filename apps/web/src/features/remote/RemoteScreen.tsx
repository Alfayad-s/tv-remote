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
import { ANDROID_APK_FILENAME, ANDROID_APK_HREF } from "../../utils/androidApk.js";
import { isNativeAndroid } from "../../native/platform.js";
import { serviceStatusLabel, tvStateLabel } from "../../utils/labels.js";
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
    imeActive,
  } = useConnection();
  const haptic = useHaptics();
  const [panel, setPanel] = useState<RemotePanel>("remote");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const wasImeActive = useRef(false);
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

  useEffect(() => {
    if (imeActive && !wasImeActive.current && tvState === "CONNECTED") {
      haptic();
      setKeyboardOpen(true);
    }
    wasImeActive.current = imeActive;
  }, [haptic, imeActive, tvState]);

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
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-[clamp(0.75rem,4vw,1rem)] pt-[max(0.35rem,env(safe-area-inset-top))]">
        <div className="grid shrink-0 grid-cols-2 gap-1 rounded-full border border-line bg-ink-soft/80 p-1">
          {PANELS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`flex min-h-10 items-center justify-center gap-1 rounded-full px-1 text-[13px] font-semibold ${
                  panel === item.id ? "bg-accent-strong text-ink" : "text-cyan-100/70"
                }`}
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

        <div className="mt-2 flex shrink-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <StatusDot state={tvState} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {tv?.name ?? "iFFALCON TV"}
              </p>
              <p className="text-[11px] text-cyan-100/55" data-testid="tv-status">
                TV: {tvStateLabel(tvState)}
              </p>
            </div>
          </div>
          <ConnectButton compact />
        </div>

        {lastError ? (
          <p className="mt-2 shrink-0 rounded-2xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-rose-100">
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
          <p className="mt-2 hidden shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[11px] text-cyan-100/40 min-[400px]:block [@media(orientation:landscape)_and_(max-height:560px)]:hidden">
            <ConnectedHint panel={panel} lastCommand={lastCommand} />
          </p>
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
    <main className="flex min-h-0 flex-1 flex-col gap-[clamp(0.75rem,2.2dvh,1.25rem)] overflow-y-auto overscroll-contain px-[clamp(1rem,4.5vw,1.25rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="shrink-0 pt-1">
        <p className="text-xs uppercase tracking-[0.28em] text-accent/80">Personal remote</p>
        <h1 className="mt-2 text-[clamp(1.5rem,7vw,1.875rem)] font-semibold tracking-tight text-white">
          iFFALCON Remote
        </h1>
      </header>

      {!isNativeAndroid() ? (
        <a
          href={ANDROID_APK_HREF}
          download={ANDROID_APK_FILENAME}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-accent-strong px-5 text-base font-semibold tracking-wide text-ink shadow-[0_12px_40px_rgb(45_212_191_/_0.28)] transition hover:brightness-110 active:scale-[0.98]"
        >
          Download app
        </a>
      ) : null}

      <ConnectionStatus />

      <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink-soft/80 px-4 py-3 text-sm text-cyan-100/70">
        <StatusDot state={serviceStatus} />
        <span>{serviceStatusLabel(serviceStatus, isNativeAndroid() ? "native" : "web")}</span>
      </div>

      {!isNativeAndroid() ? <HomeNetworkCard /> : null}

      {lastError ? (
        <p className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-rose-100">
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

      <p className="mt-auto text-center text-xs text-cyan-100/40">
        {tvState === "PAIRING"
          ? "Enter the code shown on the TV to finish pairing."
          : "Connect the TV to use the remote."}
      </p>
    </main>
  );
}
