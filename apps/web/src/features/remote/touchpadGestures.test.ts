import { afterEach, describe, expect, it } from "vitest";
import {
  applyPointerDelta,
  createSwipeAccumulator,
  isTouchpadSensitivity,
  readTouchpadSensitivity,
  TOUCHPAD_AXIS_LOCK_PX,
  TOUCHPAD_MAX_STEPS_PER_MOVE,
  writeTouchpadSensitivity,
} from "./touchpadGestures.js";

describe("touchpadGestures", () => {
  afterEach(() => {
    writeTouchpadSensitivity("normal");
  });

  it("locks to the dominant axis and emits D-pad steps", () => {
    const first = applyPointerDelta(createSwipeAccumulator(), TOUCHPAD_AXIS_LOCK_PX + 4, 2, 32);
    expect(first.next.axis).toBe("x");
    expect(first.commands).toEqual([]);

    const second = applyPointerDelta(first.next, 32, 40, 32);
    expect(second.commands).toEqual(["RIGHT"]);
    expect(second.next.remainderY).toBe(0);
  });

  it("emits multiple steps for a long swipe and caps a single move", () => {
    const locked = applyPointerDelta(createSwipeAccumulator(), 0, TOUCHPAD_AXIS_LOCK_PX + 1, 18);
    const burst = applyPointerDelta(locked.next, 0, 18 * 20, 18);
    expect(burst.commands).toHaveLength(TOUCHPAD_MAX_STEPS_PER_MOVE);
    expect(burst.commands.every((command) => command === "DOWN")).toBe(true);
    expect(Math.abs(burst.next.remainderY)).toBeGreaterThan(0);
  });

  it("reads and writes sensitivity", () => {
    expect(isTouchpadSensitivity("fast")).toBe(true);
    expect(isTouchpadSensitivity("medium")).toBe(false);
    writeTouchpadSensitivity("normal");
    expect(readTouchpadSensitivity()).toBe("normal");
    writeTouchpadSensitivity("slow");
    expect(readTouchpadSensitivity()).toBe("slow");
  });
});
