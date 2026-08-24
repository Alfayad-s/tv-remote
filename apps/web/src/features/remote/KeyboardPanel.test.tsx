import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { KeyboardPanel } from "./KeyboardPanel.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";
import { KEYBOARD_FLUSH_MS } from "./keyboardText.js";

function renderKeyboard(disabled = false) {
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
    sendCommand: vi.fn(),
    sendText: vi.fn(() => true),
    submitPin: vi.fn(),
    discoverTvs: vi.fn(),
    selectTv: vi.fn(),
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return { ...render(<KeyboardPanel disabled={disabled} />, { wrapper: Wrapper }), value };
}

describe("KeyboardPanel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show a Send button", () => {
    renderKeyboard();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
  });

  it("sends typed text automatically after a short pause", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Search or type…");

    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "he" } });
    fireEvent.change(input, { target: { value: "hello" } });
    expect(value.sendText).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(KEYBOARD_FLUSH_MS);
    });
    expect(value.sendText).toHaveBeenCalledTimes(1);
    expect(value.sendText).toHaveBeenCalledWith("hello");
  });

  it("sends backspaces when text is deleted", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Search or type…");

    fireEvent.change(input, { target: { value: "hi" } });
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_FLUSH_MS);
    });
    fireEvent.change(input, { target: { value: "h" } });
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_FLUSH_MS);
    });

    expect(value.sendCommand).toHaveBeenCalledWith("BACKSPACE");
    expect(value.sendText).toHaveBeenCalledWith("hi");
  });

  it("flushes immediately and sends ENTER on submit", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Search or type…");

    fireEvent.change(input, { target: { value: "cats" } });
    fireEvent.submit(screen.getByRole("form", { name: "TV keyboard" }));

    expect(value.sendText).toHaveBeenCalledWith("cats");
    expect(value.sendCommand).toHaveBeenCalledWith("ENTER");
  });

  it("does not send while composing IME text", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Search or type…");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ni" } });
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_FLUSH_MS);
    });
    expect(value.sendText).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input);
    expect(value.sendText).toHaveBeenCalledWith("ni");
  });

  it("does not send while disabled", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard(true);
    fireEvent.change(screen.getByPlaceholderText("Search or type…"), { target: { value: "no" } });
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_FLUSH_MS);
    });
    expect(value.sendText).not.toHaveBeenCalled();
  });
});
