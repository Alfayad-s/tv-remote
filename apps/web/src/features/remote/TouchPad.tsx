import { useCallback, useRef, useState, type PointerEvent } from "react";
import type { RemoteCommand } from "@tv-remote/shared";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { RemoteKey } from "./RemoteKey.js";
import { IconBack, IconKeyboard } from "./remoteIcons.js";
import {
  applyPointerDelta,
  createSwipeAccumulator,
  movementDistance,
  readTouchpadSensitivity,
  TOUCHPAD_LONG_PRESS_MS,
  TOUCHPAD_STEP_PX,
  TOUCHPAD_TAP_SLOP_PX,
  writeTouchpadSensitivity,
  type SwipeAccumulator,
  type TouchpadSensitivity,
} from "./touchpadGestures.js";

interface PointerSession {
  pointerId: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  sentSwipe: boolean;
  longPressed: boolean;
  acc: SwipeAccumulator;
}

const SENSITIVITY_OPTIONS: { id: TouchpadSensitivity; label: string }[] = [
  { id: "slow", label: "Slow" },
  { id: "normal", label: "Normal" },
  { id: "fast", label: "Fast" },
];

export function TouchPad({
  disabled,
  compact = false,
  fill = false,
  onOpenKeyboard,
}: {
  disabled: boolean;
  compact?: boolean;
  fill?: boolean;
  onOpenKeyboard?: () => void;
}) {
  const { sendCommand } = useConnection();
  const haptic = useHaptics();
  const [sensitivity, setSensitivity] = useState<TouchpadSensitivity>(readTouchpadSensitivity);
  const [active, setActive] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const sessionRef = useRef<PointerSession | null>(null);
  const longPressTimer = useRef<number | undefined>(undefined);

  const press = (command: RemoteCommand) => () => {
    sendCommand(command);
  };

  const clearLongPress = (): void => {
    if (longPressTimer.current !== undefined) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = undefined;
    }
  };

  const updateCursor = (event: PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    setCursor({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const endSession = (event: PointerEvent<HTMLDivElement>, allowTap: boolean): void => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    clearLongPress();
    const travel = movementDistance(session.lastX - session.startX, session.lastY - session.startY);
    if (
      allowTap &&
      !disabled &&
      !session.sentSwipe &&
      !session.longPressed &&
      travel < TOUCHPAD_TAP_SLOP_PX
    ) {
      haptic();
      sendCommand("OK");
    }
    sessionRef.current = null;
    setActive(false);
    setCursor(null);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (disabled || sessionRef.current) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    sessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      sentSwipe: false,
      longPressed: false,
      acc: createSwipeAccumulator(),
    };
    setActive(true);
    updateCursor(event);
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      const session = sessionRef.current;
      if (!session || session.sentSwipe || disabled) {
        return;
      }
      session.longPressed = true;
      haptic([10, 24, 10]);
      sendCommand("OK");
    }, TOUCHPAD_LONG_PRESS_MS);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) {
      return;
    }
    updateCursor(event);
    const dx = event.clientX - session.lastX;
    const dy = event.clientY - session.lastY;
    session.lastX = event.clientX;
    session.lastY = event.clientY;
    const travel = movementDistance(event.clientX - session.startX, event.clientY - session.startY);
    if (travel >= TOUCHPAD_TAP_SLOP_PX) {
      clearLongPress();
    }
    if (disabled) {
      return;
    }
    const { next, commands } = applyPointerDelta(
      session.acc,
      dx,
      dy,
      TOUCHPAD_STEP_PX[sensitivity],
    );
    session.acc = next;
    if (commands.length === 0) {
      return;
    }
    session.sentSwipe = true;
    haptic(8);
    for (const command of commands) {
      sendCommand(command);
    }
  };

  const chooseSensitivity = useCallback(
    (value: TouchpadSensitivity) => {
      haptic();
      setSensitivity(value);
      writeTouchpadSensitivity(value);
    },
    [haptic],
  );

  return (
    <section
      className={`flex min-h-0 flex-col gap-[clamp(0.5rem,1.4dvh,0.75rem)] ${fill ? "flex-1" : ""}`}
      aria-label={compact ? "Remote touchpad" : "Touchpad"}
    >
      <div
        role="application"
        aria-label="TV touchpad"
        aria-disabled={disabled}
        data-testid="touchpad"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => {
          endSession(event, true);
        }}
        onPointerCancel={(event) => {
          endSession(event, false);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
        }}
        className={`relative isolate touch-none overflow-hidden rounded-[1.75rem] border border-line bg-ink-soft/90 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)] select-none ${
          compact ? "min-h-[11rem]" : fill ? "min-h-0 flex-1" : "min-h-[18.5rem]"
        } ${disabled ? "cursor-not-allowed opacity-40" : "cursor-none"}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-6 rounded-[1.35rem] border border-dashed border-white/8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-8 bottom-8 w-px bg-white/8"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-8 right-8 h-px bg-white/8"
        />
        {!active ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-cyan-100/45">
            Swipe to browse
          </p>
        ) : null}
        {cursor ? (
          <span
            aria-hidden="true"
            data-testid="touchpad-cursor"
            className="pointer-events-none absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/80 bg-accent-strong/80 shadow-[0_0_24px_rgb(45_212_191_/_0.55)]"
            style={{ left: `${String(cursor.x)}%`, top: `${String(cursor.y)}%` }}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/40">Sensitivity</p>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-line bg-ink-soft/70 p-1">
          {SENSITIVITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={sensitivity === option.id}
              aria-label={`${option.label} sensitivity`}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold ${
                sensitivity === option.id ? "bg-accent-strong text-ink" : "text-cyan-100/70"
              }`}
              onClick={() => {
                chooseSensitivity(option.id);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {compact ? null : (
        <div className="grid grid-cols-2 gap-3">
          <RemoteKey
            label="Back"
            disabled={disabled}
            flush
            className="remote-key-h rounded-full"
            onPress={press("BACK")}
          >
            <span className="flex items-center gap-2">
              <IconBack />
              Back
            </span>
          </RemoteKey>
          <RemoteKey
            label="Open keyboard"
            disabled={disabled}
            flush
            className="remote-key-h rounded-full"
            onPress={() => {
              onOpenKeyboard?.();
            }}
          >
            <span className="flex items-center gap-2">
              <IconKeyboard />
              Keyboard
            </span>
          </RemoteKey>
        </div>
      )}
    </section>
  );
}
