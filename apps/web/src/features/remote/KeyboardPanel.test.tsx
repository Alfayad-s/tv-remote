import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { KeyboardPanel } from "./KeyboardPanel.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";
import { KEYBOARD_COMPOSING_FLUSH_MS } from "./keyboardText.js";

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
    launchApp: vi.fn(),
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

  it("sends only the new characters for each keystroke", () => {
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Type here…");

    fireEvent.change(input, { target: { value: "c" } });
    fireEvent.change(input, { target: { value: "ca" } });
    fireEvent.change(input, { target: { value: "cat" } });

    expect(value.sendText).toHaveBeenNthCalledWith(1, "c");
    expect(value.sendText).toHaveBeenNthCalledWith(2, "a");
    expect(value.sendText).toHaveBeenNthCalledWith(3, "t");
    expect(value.sendText).toHaveBeenCalledTimes(3);

    fireEvent.blur(input);
    expect(value.sendText).toHaveBeenCalledTimes(3);
  });

  it("sends backspaces when characters are deleted", () => {
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Type here…");

    fireEvent.change(input, { target: { value: "hi" } });
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "ho" } });

    expect(value.sendText).toHaveBeenNthCalledWith(1, "hi");
    expect(value.sendText).toHaveBeenNthCalledWith(2, "o");
    expect(value.sendText).toHaveBeenCalledTimes(2);
    expect(value.sendCommand).toHaveBeenCalledWith("BACKSPACE");
    expect(value.sendCommand).toHaveBeenCalledTimes(1);
  });

  it("flushes remaining text and sends ENTER on submit", () => {
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Type here…");

    fireEvent.change(input, { target: { value: "cats" } });
    fireEvent.submit(screen.getByRole("form", { name: "TV keyboard" }));

    expect(value.sendText).toHaveBeenCalledWith("cats");
    expect(value.sendText).toHaveBeenCalledTimes(1);
    expect(value.sendCommand).toHaveBeenCalledWith("ENTER");
  });

  it("does not send while composing IME text", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Type here…");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ni" } });
    expect(value.sendText).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input);
    expect(value.sendText).toHaveBeenCalledWith("ni");
    expect(value.sendText).toHaveBeenCalledTimes(1);
  });

  it("sends composing text if composition never ends", () => {
    vi.useFakeTimers();
    const { value } = renderKeyboard();
    const input = screen.getByPlaceholderText("Type here…");

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "ni" } });
    act(() => {
      vi.advanceTimersByTime(KEYBOARD_COMPOSING_FLUSH_MS);
    });
    expect(value.sendText).toHaveBeenCalledWith("ni");
  });

  it("does not send while disabled", () => {
    const { value } = renderKeyboard(true);
    fireEvent.change(screen.getByPlaceholderText("Type here…"), { target: { value: "no" } });
    expect(value.sendText).not.toHaveBeenCalled();
  });
});
