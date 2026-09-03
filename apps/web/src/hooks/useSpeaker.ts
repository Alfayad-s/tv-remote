import { useCallback, useEffect, useRef, useState } from "react";
import { BtAudio, IDLE_SPEAKER_STATE, type SpeakerState } from "../native/btAudio.js";
import { isNativeAndroid } from "../native/platform.js";

export interface SpeakerStore {
  /** False in the browser, where none of the Android audio APIs exist. */
  supported: boolean;
  ready: boolean;
  state: SpeakerState;
  error: string | null;
  setVolume: (level: number) => void;
  adjustVolume: (direction: "up" | "down") => void;
  toggleMute: () => void;
  skip: (key: "next" | "previous") => void;
  openSystemEqualizer: () => void;
  openBluetoothSettings: () => void;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useSpeaker(): SpeakerStore {
  const supported = isNativeAndroid();
  const [state, setState] = useState<SpeakerState>(IDLE_SPEAKER_STATE);
  const [ready, setReady] = useState(!supported);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const apply = useCallback((next: SpeakerState) => {
    if (alive.current) {
      setState(next);
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    if (!supported) {
      return () => {
        alive.current = false;
      };
    }

    let listener: { remove: () => Promise<void> } | null = null;
    void (async () => {
      try {
        // Doubles as the one-time BLUETOOTH_CONNECT prompt so the speaker can be named.
        apply(await BtAudio.requestBluetoothName());
      } catch (cause: unknown) {
        if (alive.current) {
          setError(messageOf(cause, "Could not read the audio output."));
        }
      }
      if (alive.current) {
        setReady(true);
      }
      listener = await BtAudio.addListener("state", apply);
      if (!alive.current) {
        void listener.remove();
      }
    })();

    return () => {
      alive.current = false;
      void listener?.remove();
    };
  }, [apply, supported]);

  const run = useCallback(
    (action: () => Promise<SpeakerState | void>, fallback: string, optimistic?: SpeakerState) => {
      if (!supported) {
        return;
      }
      if (optimistic) {
        apply(optimistic);
      }
      setError(null);
      void action()
        .then((next) => {
          if (next) {
            apply(next);
          }
        })
        .catch((cause: unknown) => {
          if (alive.current) {
            setError(messageOf(cause, fallback));
          }
        });
    },
    [apply, supported],
  );

  return {
    supported,
    ready,
    state,
    error,
    setVolume: (level) =>
      run(() => BtAudio.setVolume({ level }), "Could not change the volume.", {
        ...state,
        volume: level,
        muted: false,
      }),
    adjustVolume: (direction) =>
      run(() => BtAudio.adjustVolume({ direction }), "Could not change the volume."),
    toggleMute: () =>
      run(() => BtAudio.setMuted({ muted: !state.muted }), "Could not mute the speaker.", {
        ...state,
        muted: !state.muted,
      }),
    skip: (key) => run(() => BtAudio.mediaKey({ key }), "Could not send the track command."),
    openSystemEqualizer: () =>
      run(() => BtAudio.openSystemEqualizer(), "This phone has no equalizer app."),
    openBluetoothSettings: () =>
      run(() => BtAudio.openBluetoothSettings(), "Could not open Bluetooth settings."),
  };
}
