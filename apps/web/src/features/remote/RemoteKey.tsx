import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { useHaptics } from "../../hooks/useHaptics.js";

const REPEAT_DELAY_MS = 380;
const REPEAT_MS = 170;

export type RemoteKeyTone = "default" | "ok" | "danger" | "quiet";

const TONE_CLASS: Record<RemoteKeyTone, string> = {
  default: "border-line bg-white/6 text-white hover:bg-white/10",
  ok: "border-accent/40 bg-accent-strong text-ink shadow-[0_10px_28px_rgb(45_212_191_/_0.28)] hover:brightness-110",
  danger: "border-danger/30 bg-danger/15 text-rose-100 hover:bg-danger/25",
  quiet: "border-line bg-ink-soft/80 text-cyan-50 hover:bg-white/8",
};

interface RemoteKeyProps {
  label: string;
  disabled?: boolean;
  repeat?: boolean;
  tone?: RemoteKeyTone;
  className?: string;
  children: ReactNode;
  onPress: () => void;
}

export function RemoteKey({
  label,
  disabled = false,
  repeat = false,
  tone = "default",
  className = "",
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
      className={`flex min-h-14 min-w-14 select-none items-center justify-center rounded-2xl border text-sm font-semibold tracking-wide transition-[transform,background-color,filter] touch-manipulation active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-35 ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </button>
  );
}
