import type { RemoteCommand } from "@tv-remote/shared";

export type TouchpadSensitivity = "slow" | "normal" | "fast";
export type AxisLock = "x" | "y" | null;
export type DpadCommand = Extract<RemoteCommand, "UP" | "DOWN" | "LEFT" | "RIGHT">;

export const TOUCHPAD_STEP_PX: Record<TouchpadSensitivity, number> = {
  slow: 56,
  normal: 32,
  fast: 18,
};

export const TOUCHPAD_TAP_SLOP_PX = 18;
export const TOUCHPAD_LONG_PRESS_MS = 520;
export const TOUCHPAD_AXIS_LOCK_PX = 12;
export const TOUCHPAD_MAX_STEPS_PER_MOVE = 6;

const STORAGE_KEY = "tv-remote.touchpad-sensitivity";

const memoryStore = new Map<string, string>();

function storageGet(key: string): string | null {
  try {
    const value = window.localStorage?.getItem(key);
    if (typeof value === "string") {
      return value;
    }
  } catch {
    // Private mode / missing storage.
  }
  return memoryStore.get(key) ?? null;
}

function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function isTouchpadSensitivity(value: unknown): value is TouchpadSensitivity {
  return value === "slow" || value === "normal" || value === "fast";
}

export function readTouchpadSensitivity(): TouchpadSensitivity {
  const raw = storageGet(STORAGE_KEY);
  if (isTouchpadSensitivity(raw)) {
    return raw;
  }
  return "normal";
}

export function writeTouchpadSensitivity(value: TouchpadSensitivity): void {
  storageSet(STORAGE_KEY, value);
}

export interface SwipeAccumulator {
  remainderX: number;
  remainderY: number;
  axis: AxisLock;
}

export function createSwipeAccumulator(): SwipeAccumulator {
  return { remainderX: 0, remainderY: 0, axis: null };
}

export function movementDistance(dx: number, dy: number): number {
  return Math.hypot(dx, dy);
}

export function applyPointerDelta(
  acc: SwipeAccumulator,
  dx: number,
  dy: number,
  stepPx: number,
): { next: SwipeAccumulator; commands: DpadCommand[] } {
  let remainderX = acc.remainderX + dx;
  let remainderY = acc.remainderY + dy;
  let axis = acc.axis;

  if (axis === null) {
    const absX = Math.abs(remainderX);
    const absY = Math.abs(remainderY);
    if (absX >= TOUCHPAD_AXIS_LOCK_PX || absY >= TOUCHPAD_AXIS_LOCK_PX) {
      axis = absX >= absY ? "x" : "y";
    }
  }

  const commands: DpadCommand[] = [];

  if (axis === "x") {
    remainderY = 0;
    while (commands.length < TOUCHPAD_MAX_STEPS_PER_MOVE && Math.abs(remainderX) >= stepPx) {
      const sign = remainderX > 0 ? 1 : -1;
      commands.push(sign > 0 ? "RIGHT" : "LEFT");
      remainderX -= sign * stepPx;
    }
  } else if (axis === "y") {
    remainderX = 0;
    while (commands.length < TOUCHPAD_MAX_STEPS_PER_MOVE && Math.abs(remainderY) >= stepPx) {
      const sign = remainderY > 0 ? 1 : -1;
      commands.push(sign > 0 ? "DOWN" : "UP");
      remainderY -= sign * stepPx;
    }
  }

  return { next: { remainderX, remainderY, axis }, commands };
}
