import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { TouchPad } from "./TouchPad.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";
import { TOUCHPAD_LONG_PRESS_MS, writeTouchpadSensitivity } from "./touchpadGestures.js";

function renderPad(disabled = false) {
  const value: ConnectionStore = {
    serviceStatus: "open",
    tvState: "CONNECTED",
    tv: null,
    devices: [],
    selectedTvId: null,
    discoveryStatus: "done",
    lastError: null,
    lastCommand: null,
    imeActive: false,
    connectTv: vi.fn(),
    disconnectTv: vi.fn(),
    resetApp: vi.fn(),
    sendCommand: vi.fn(),
    sendText: vi.fn(),
    launchApp: vi.fn(),
    submitPin: vi.fn(),
    discoverTvs: vi.fn(),
    selectTv: vi.fn(),
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return { ...render(<TouchPad disabled={disabled} />, { wrapper: Wrapper }), value };
}

function point(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup",
  x: number,
  y: number,
): void {
  act(() => {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: 1,
        pointerType: "touch",
        clientX: x,
        clientY: y,
        buttons: type === "pointerup" ? 0 : 1,
      }),
    );
  });
}

describe("TouchPad", () => {
  afterEach(() => {
    writeTouchpadSensitivity("normal");
    vi.useRealTimers();
  });

  it("sends OK on tap", () => {
    const { value } = renderPad();
    const pad = screen.getByTestId("touchpad");

    point(pad, "pointerdown", 120, 120);
    point(pad, "pointerup", 122, 121);

    expect(value.sendCommand).toHaveBeenCalledWith("OK");
    expect(value.sendCommand).toHaveBeenCalledTimes(1);
  });

  it("converts a horizontal swipe into RIGHT", () => {
    const { value } = renderPad();
    const pad = screen.getByTestId("touchpad");

    point(pad, "pointerdown", 40, 100);
    point(pad, "pointermove", 120, 104);
    point(pad, "pointerup", 120, 104);

    expect(value.sendCommand).toHaveBeenCalledWith("RIGHT");
    expect(value.sendCommand).not.toHaveBeenCalledWith("OK");
  });

  it("converts a vertical swipe into DOWN", () => {
    const { value } = renderPad();
    const pad = screen.getByTestId("touchpad");

    point(pad, "pointerdown", 80, 40);
    point(pad, "pointermove", 82, 120);
    point(pad, "pointerup", 82, 120);

    expect(value.sendCommand).toHaveBeenCalledWith("DOWN");
    expect(value.sendCommand).not.toHaveBeenCalledWith("OK");
  });

  it("sends OK on long press without a second tap", () => {
    vi.useFakeTimers();
    const { value } = renderPad();
    const pad = screen.getByTestId("touchpad");

    point(pad, "pointerdown", 100, 100);
    act(() => {
      vi.advanceTimersByTime(TOUCHPAD_LONG_PRESS_MS);
    });
    point(pad, "pointerup", 101, 100);

    expect(value.sendCommand).toHaveBeenCalledWith("OK");
    expect(value.sendCommand).toHaveBeenCalledTimes(1);
  });

  it("does not send commands while disabled", () => {
    const { value } = renderPad(true);
    const pad = screen.getByTestId("touchpad");

    point(pad, "pointerdown", 40, 40);
    point(pad, "pointermove", 140, 40);
    point(pad, "pointerup", 140, 40);

    expect(value.sendCommand).not.toHaveBeenCalled();
  });

  it("stores the chosen sensitivity", () => {
    renderPad();
    fireEvent.click(screen.getByRole("button", { name: "Fast sensitivity" }));
    expect(screen.getByRole("button", { name: "Fast sensitivity" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("sends BACK from the bottom row and can open the keyboard", () => {
    const onOpenKeyboard = vi.fn();
    const value: ConnectionStore = {
      serviceStatus: "open",
      tvState: "CONNECTED",
      tv: null,
      devices: [],
      selectedTvId: null,
      discoveryStatus: "done",
      lastError: null,
      lastCommand: null,
      imeActive: false,
      connectTv: vi.fn(),
      disconnectTv: vi.fn(),
      resetApp: vi.fn(),
      sendCommand: vi.fn(),
      sendText: vi.fn(),
      launchApp: vi.fn(),
      submitPin: vi.fn(),
      discoverTvs: vi.fn(),
      selectTv: vi.fn(),
    };

    function Wrapper({ children }: { children: ReactNode }) {
      return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
    }

    render(<TouchPad disabled={false} onOpenKeyboard={onOpenKeyboard} />, { wrapper: Wrapper });
    fireEvent.pointerDown(screen.getByRole("button", { name: "Back" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Open keyboard" }));

    expect(value.sendCommand).toHaveBeenCalledWith("BACK");
    expect(onOpenKeyboard).toHaveBeenCalledTimes(1);
  });

  it("changes volume when swiping the volume strip", () => {
    const { value } = renderPad();
    const strip = screen.getByTestId("volume-strip");

    point(strip, "pointerdown", 20, 160);
    point(strip, "pointermove", 20, 80);
    point(strip, "pointerup", 20, 80);

    expect(value.sendCommand).toHaveBeenCalledWith("VOLUME_UP");
    expect(value.sendCommand).not.toHaveBeenCalledWith("OK");
  });
});
