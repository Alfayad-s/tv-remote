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
import { IconEnter } from "./remoteIcons.js";
import { diffTypedText, KEYBOARD_COMPOSING_FLUSH_MS } from "./keyboardText.js";

export function KeyboardPanel({
  disabled,
  autoFocus = true,
  hidden = false,
  onInputBlur,
  inputRef: inputRefProp,
}: {
  disabled: boolean;
  autoFocus?: boolean;
  hidden?: boolean;
  onInputBlur?: () => void;
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
      className={hidden ? "absolute left-0 top-0 h-px w-px overflow-hidden opacity-[0.01]" : "flex min-w-0 flex-1 items-center gap-2"}
      onSubmit={onSubmit}
      aria-label="TV keyboard"
    >
      <label className="sr-only" htmlFor="tv-text">
        TV text
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
          onInputBlur?.();
        }}
        placeholder="Type here…"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoComplete="off"
        enterKeyHint="enter"
        inputMode="text"
        autoFocus={false}
        disabled={disabled}
        maxLength={MAX_SEND_TEXT_CHARS}
        className={
          hidden
            ? "h-px w-px border-0 bg-transparent p-0 text-transparent caret-transparent outline-none"
            : "min-h-11 min-w-0 flex-1 border-4 border-ink bg-paper px-3 text-base text-ink outline-none placeholder:text-ink/35 disabled:opacity-40 sm:min-h-12 sm:px-4"
        }
      />
      {hidden ? null : (
        <button
          type="submit"
          aria-label="Enter"
          disabled={disabled}
          className="brutal-press flex size-11 shrink-0 items-center justify-center border-4 border-ink bg-accent-strong text-ink shadow-[3px_3px_0_#111] disabled:opacity-40 sm:size-12"
        >
          <IconEnter />
        </button>
      )}
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
  if (!open) {
    return null;
  }

  return (
    <div className="relative h-0 w-0 overflow-visible">
      <KeyboardPanel
        disabled={disabled}
        autoFocus
        hidden
        inputRef={inputRef}
        onInputBlur={onClose}
      />
    </div>
  );
}
