import { useEffect, useRef, useState, type FormEvent } from "react";
import { MAX_SEND_TEXT_CHARS } from "@tv-remote/shared";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { RemoteKey } from "./RemoteKey.js";
import { diffTypedText, KEYBOARD_FLUSH_MS } from "./keyboardText.js";

export function KeyboardPanel({ disabled }: { disabled: boolean }) {
  const { sendText, sendCommand, imeActive } = useConnection();
  const haptic = useHaptics();
  const [value, setValue] = useState("");
  const valueRef = useRef(value);
  const syncedRef = useRef("");
  const composingRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);
  const disabledRef = useRef(disabled);
  const sendTextRef = useRef(sendText);
  const sendCommandRef = useRef(sendCommand);

  disabledRef.current = disabled;
  sendTextRef.current = sendText;
  sendCommandRef.current = sendCommand;
  valueRef.current = value;

  const clearTimer = (): void => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const flush = (): void => {
    clearTimer();
    if (disabledRef.current || composingRef.current) {
      return;
    }
    const next = valueRef.current;
    const delta = diffTypedText(syncedRef.current, next);
    for (let i = 0; i < delta.backspaces; i += 1) {
      sendCommandRef.current("BACKSPACE");
    }
    if (delta.insert.length > 0 && sendTextRef.current(delta.insert) === false) {
      return;
    }
    syncedRef.current = next;
  };

  const scheduleFlush = (): void => {
    clearTimer();
    if (disabledRef.current || composingRef.current) {
      return;
    }
    timerRef.current = window.setTimeout(() => {
      flush();
    }, KEYBOARD_FLUSH_MS);
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const setTyped = (next: string): void => {
    const clipped = next.slice(0, MAX_SEND_TEXT_CHARS);
    valueRef.current = clipped;
    setValue(clipped);
    scheduleFlush();
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    flush();
    haptic();
    sendCommand("ENTER");
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit} aria-label="TV keyboard">
      <p className="text-sm leading-6 text-cyan-100/65">
        {imeActive
          ? "The TV is waiting for text. Type here — it goes to the field automatically."
          : "Open a search field on the TV, then type here. Letters go to the TV as you type — there is no Send button."}
      </p>
      <label className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
        Live typing
        <input
          name="tv-text"
          value={value}
          onChange={(event) => {
            setTyped(event.target.value);
          }}
          onCompositionStart={() => {
            composingRef.current = true;
            clearTimer();
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
            flush();
          }}
          placeholder="Search or type…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="enter"
          autoFocus
          disabled={disabled}
          maxLength={MAX_SEND_TEXT_CHARS}
          className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-ink-soft/80 px-4 text-base text-white outline-none placeholder:text-cyan-100/25 focus:border-accent/50 disabled:opacity-40"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <RemoteKey
          label="Backspace"
          disabled={disabled}
          repeat
          onPress={() => {
            const chars = Array.from(valueRef.current);
            if (chars.length === 0) {
              sendCommand("BACKSPACE");
              return;
            }
            setTyped(chars.slice(0, -1).join(""));
          }}
        >
          ⌫
        </RemoteKey>
        <RemoteKey
          label="Enter"
          disabled={disabled}
          onPress={() => {
            flush();
            sendCommand("ENTER");
          }}
        >
          Enter
        </RemoteKey>
      </div>
    </form>
  );
}
