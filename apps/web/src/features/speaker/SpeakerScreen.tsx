import { Bluetooth, SkipBack, SkipForward, Volume1, Volume2, VolumeX } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useSpeaker } from "../../hooks/useSpeaker.js";
import { RemoteKey } from "../remote/RemoteKey.js";

function ToneSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}): ReactNode {
  const haptic = useHaptics();

  return (
    <label className="block border-4 border-ink bg-paper p-4 shadow-[4px_4px_0_#111]">
      <span className="flex items-baseline justify-between font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
        {label}
        <span>{value === 50 ? "Flat" : `${value > 50 ? "+" : "−"}${String(Math.abs(value - 50))}`}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        aria-label={label}
        className="mt-3 h-2 w-full appearance-none border-2 border-ink bg-accent-strong accent-ink"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          haptic();
          onChange(Number(event.target.value));
        }}
      />
    </label>
  );
}

export function SpeakerScreen({ onBack }: { onBack: () => void }) {
  const haptic = useHaptics();
  const {
    supported,
    ready,
    state,
    error,
    setVolume,
    adjustVolume,
    toggleMute,
    skip,
    setBass,
    setTreble,
    openSystemEqualizer,
    openBluetoothSettings,
  } = useSpeaker();

  const percent = state.maxVolume > 0 ? Math.round((state.volume / state.maxVolume) * 100) : 0;
  const showTone = state.bassSupported || state.trebleSupported;

  const back = (): void => {
    haptic();
    onBack();
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-6 pt-5">
      <header className="flex shrink-0 items-start justify-between gap-3 pt-2">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em]">
            Bluetooth audio
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,7vw,2rem)] uppercase leading-none">
            Speaker
          </h1>
        </div>
        <Button variant="ghost" size="sm" onClick={back}>
          Back
        </Button>
      </header>

      <section className="border-4 border-ink bg-paper p-4 shadow-[5px_5px_0_#111]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">Playing to</p>
            <h2 className="mt-2 truncate font-display text-xl uppercase">
              {state.connected ? (state.deviceName ?? "Bluetooth speaker") : "Nothing connected"}
            </h2>
          </div>
          <Bluetooth
            className={`size-6 shrink-0 ${state.connected ? "text-ink" : "text-ink/30"}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>
        <p className="mt-4 font-mono text-sm font-bold uppercase" data-testid="speaker-status">
          {!supported
            ? "Android app only"
            : !ready
              ? "Checking…"
              : state.connected
                ? "Speaker: Connected"
                : "Speaker: Not connected"}
        </p>
      </section>

      {error ? (
        <p className="border-4 border-ink bg-coral px-4 py-3 text-sm font-bold">{error}</p>
      ) : null}

      {!supported ? (
        <p className="border-4 border-ink bg-paper px-4 py-3 text-sm font-bold">
          Volume, bass and track controls need the Android app. Install it to use the speaker
          remote.
        </p>
      ) : !state.connected ? (
        <>
          <p className="border-4 border-ink bg-paper px-4 py-3 text-sm font-bold">
            Pair the speaker in Android settings first. This remote controls whichever speaker the
            phone is already playing to.
          </p>
          <Button onClick={openBluetoothSettings}>Open Bluetooth settings</Button>
        </>
      ) : (
        <>
          <section className="border-4 border-ink bg-paper p-4 shadow-[4px_4px_0_#111]">
            <div className="flex items-baseline justify-between font-mono text-[11px] font-bold uppercase tracking-[0.18em]">
              Volume
              <span data-testid="speaker-volume">{state.muted ? "Muted" : `${String(percent)}%`}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <RemoteKey label="Volume down" tone="quiet" repeat onPress={() => adjustVolume("down")}>
                <Volume1 className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </RemoteKey>
              <input
                type="range"
                min={0}
                max={state.maxVolume}
                step={1}
                value={state.muted ? 0 : state.volume}
                aria-label="Volume"
                className="h-2 min-w-0 flex-1 appearance-none border-2 border-ink bg-accent-strong accent-ink"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setVolume(Number(event.target.value));
                }}
              />
              <RemoteKey label="Volume up" tone="quiet" repeat onPress={() => adjustVolume("up")}>
                <Volume2 className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </RemoteKey>
            </div>
          </section>

          <div className="grid grid-cols-3 gap-3">
            <RemoteKey label="Previous track" tone="light" onPress={() => skip("previous")}>
              <SkipBack className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </RemoteKey>
            <RemoteKey
              label={state.muted ? "Unmute" : "Mute"}
              tone={state.muted ? "danger" : "light"}
              onPress={toggleMute}
            >
              <VolumeX className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </RemoteKey>
            <RemoteKey label="Next track" tone="light" onPress={() => skip("next")}>
              <SkipForward className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </RemoteKey>
          </div>

          {state.bassSupported ? (
            <ToneSlider label="Bass" value={state.bass} onChange={setBass} />
          ) : null}
          {state.trebleSupported ? (
            <ToneSlider label="Treble" value={state.treble} onChange={setTreble} />
          ) : null}
          {!showTone && ready ? (
            <>
              <p className="border-4 border-ink bg-paper px-4 py-3 text-sm font-bold">
                This phone does not let apps change bass or treble. Its own equalizer still works.
              </p>
              <Button variant="ghost" onClick={openSystemEqualizer}>
                System equalizer
              </Button>
            </>
          ) : null}
        </>
      )}

      <p className="mt-auto text-center font-mono text-[11px] font-bold uppercase tracking-wide text-ink/55">
        Controls the phone audio sent to the speaker.
      </p>
    </main>
  );
}
