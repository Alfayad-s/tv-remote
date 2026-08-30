import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";

const REPEAT_DELAY_MS = 380;
const REPEAT_MS = 170;

export type RemoteKeyTone =
  | "default"
  | "ok"
  | "danger"
  | "power"
  | "core"
  | "quiet"
  | "bare"
  | "light"
  | "blue";

const TONE_CLASS: Record<RemoteKeyTone, string> = {
  default: "border-ink bg-paper text-ink shadow-[4px_4px_0_#111]",
  ok: "border-ink bg-accent-strong text-ink shadow-[4px_4px_0_#111]",
  danger: "border-ink bg-coral text-ink shadow-[4px_4px_0_#111]",
  power: "border-ink bg-coral text-ink shadow-[6px_6px_0_#111]",
  core: "border-ink bg-accent-strong text-ink shadow-[4px_4px_0_#111]",
  quiet: "border-ink bg-paper text-ink shadow-[3px_3px_0_#111]",
  bare: "border-transparent bg-transparent text-ink shadow-none",
  light: "border-ink bg-paper text-ink shadow-[4px_4px_0_#111]",
  blue: "border-ink bg-blue text-paper shadow-[5px_5px_0_#111]",
};

interface RemoteKeyProps {
  label: string;
  disabled?: boolean;
  repeat?: boolean;
  flush?: boolean;
  tone?: RemoteKeyTone;
  className?: string;
  children: ReactNode;
  onPress: () => void;
}

export function RemoteKey({
  label,
  disabled = false,
  repeat = false,
  flush = false,
  tone = "default",
  className = "rounded-2xl",
  children,
  onPress,
}: RemoteKeyProps) {
  const haptic = useHaptics();
  const holdTimer = useRef<number | undefined>(undefined);
  const holdInterval = useRef<number | undefined>(undefined);
  const holding = useRef(false);

  const stopRepeat = (): void => {
    holding.current = false;
    if (holdTimer.current !== undefined) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = undefined;
    }
    if (holdInterval.current !== undefined) {
      window.clearInterval(holdInterval.current);
      holdInterval.current = undefined;
    }
  };

  useEffect(() => stopRepeat, []);

  const fire = (): void => {
    onPress();
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>): void => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    haptic();
    fire();
    if (!repeat) {
      return;
    }
    holding.current = true;
    holdTimer.current = window.setTimeout(() => {
      if (!holding.current) {
        return;
      }
      holdInterval.current = window.setInterval(fire, REPEAT_MS);
    }, REPEAT_DELAY_MS);
  };

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={onPointerDown}
      onPointerUp={stopRepeat}
      onPointerCancel={stopRepeat}
      onLostPointerCapture={stopRepeat}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (!disabled) {
            haptic();
            fire();
          }
        }
      }}
      className={`brutal-press flex select-none items-center justify-center border-[4px] font-bold tracking-wide uppercase touch-manipulation disabled:cursor-not-allowed disabled:opacity-35 ${flush ? "min-h-0 min-w-0" : "min-h-14 min-w-14"} ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
