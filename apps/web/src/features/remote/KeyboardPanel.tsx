import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { MAX_SEND_TEXT_CHARS } from "@tv-remote/shared";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { IconClose, IconEnter } from "./remoteIcons.js";
import { diffTypedText, KEYBOARD_COMPOSING_FLUSH_MS } from "./keyboardText.js";

export function KeyboardPanel({
  disabled,
  autoFocus = true,
  inputRef: inputRefProp,
}: {
  disabled: boolean;
  autoFocus?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}) {
  const { sendText, sendCommand } = useConnection();
  const haptic = useHaptics();
  const localRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp ?? localRef;
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
    if (disabledRef.current) {
      return;
    }
    const next = valueRef.current;
    if (next === syncedRef.current) {
      return;
    }
    const delta = diffTypedText(syncedRef.current, next);
    for (let i = 0; i < delta.backspaces; i += 1) {
      sendCommandRef.current("BACKSPACE");
    }
    if (delta.insert.length > 0 && sendTextRef.current(delta.insert) === false) {
      return;
    }
    syncedRef.current = next;
  };

  const setTyped = (next: string): void => {
    const clipped = next.slice(0, MAX_SEND_TEXT_CHARS);
    valueRef.current = clipped;
    setValue(clipped);
    if (composingRef.current) {
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        composingRef.current = false;
        flush();
      }, KEYBOARD_COMPOSING_FLUSH_MS);
      return;
    }
    flush();
  };

  useLayoutEffect(() => {
    if (autoFocus && !disabled) {
      inputRef.current?.focus();
    }
  }, [autoFocus, disabled, inputRef]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

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
    <form
      className="flex min-w-0 flex-1 items-center gap-2"
      onSubmit={onSubmit}
      aria-label="TV keyboard"
    >
      <label className="sr-only" htmlFor="tv-text">
        Typing preview
      </label>
      <input
        ref={inputRef}
        id="tv-text"
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
        onBlur={() => {
          flush();
        }}
        placeholder="Type here…"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        enterKeyHint="enter"
        inputMode="text"
        autoFocus={autoFocus}
        disabled={disabled}
        maxLength={MAX_SEND_TEXT_CHARS}
        className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-[#fff] px-3 text-base text-ink outline-none placeholder:text-black/35 focus:border-accent/50 disabled:opacity-40 sm:min-h-12 sm:px-4"
      />
      <button
        type="submit"
        aria-label="Enter"
        disabled={disabled}
        className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-ink-soft text-white disabled:opacity-40 sm:size-12"
      >
        <IconEnter />
      </button>
    </form>
  );
}

export function KeyboardComposer({
  disabled,
  open,
  onClose,
  inputRef,
}: {
  disabled: boolean;
  open: boolean;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      className={
        open
          ? "z-20 shrink-0 border-t border-line bg-[#101820] px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
          : "pointer-events-none fixed bottom-0 left-0 z-[1] h-px w-full"
      }
      style={open ? undefined : { opacity: 0 }}
      role={open ? "dialog" : undefined}
      aria-hidden={!open}
      aria-label={open ? "Typing preview" : undefined}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Close keyboard"
          tabIndex={open ? 0 : -1}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-cyan-100/70 hover:bg-white/8 hover:text-white sm:size-12"
          onClick={onClose}
        >
          <IconClose />
        </button>
        <KeyboardPanel disabled={disabled} autoFocus={open} inputRef={inputRef} />
      </div>
    </div>
  );
}
