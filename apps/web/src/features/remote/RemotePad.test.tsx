import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { RemotePad } from "./RemotePad.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";

function renderPad(disabled = false, onOpenKeyboard?: () => void) {
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
    sendText: vi.fn(),
    launchApp: vi.fn(),
    submitPin: vi.fn(),
    discoverTvs: vi.fn(),
    selectTv: vi.fn(),
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return {
    ...render(
      <RemotePad
        disabled={disabled}
        {...(onOpenKeyboard === undefined ? {} : { onOpenKeyboard })}
      />,
      { wrapper: Wrapper },
    ),
    value,
  };
}

describe("RemotePad", () => {
  it("sends D-pad, OK, and volume commands", async () => {
    const user = userEvent.setup();
    const { value } = renderPad();

    await user.click(screen.getByRole("button", { name: "Up" }));
    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Volume up" }));
    await user.click(screen.getByRole("button", { name: "Play pause" }));

    expect(value.sendCommand).toHaveBeenCalledWith("UP");
    expect(value.sendCommand).toHaveBeenCalledWith("OK");
    expect(value.sendCommand).toHaveBeenCalledWith("VOLUME_UP");
    expect(value.sendCommand).toHaveBeenCalledWith("PLAY_PAUSE");
  });

  it("does not send commands while disabled", async () => {
    const user = userEvent.setup();
    const { value } = renderPad(true);

    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(value.sendCommand).not.toHaveBeenCalled();
  });

  it("shows a live time button that does not send a TV command", async () => {
    const user = userEvent.setup();
    const { value } = renderPad();

    const time = screen.getByRole("button", { name: "Time" });
    expect(time).toHaveTextContent(/\d/);
    await user.click(time);
    expect(value.sendCommand).not.toHaveBeenCalled();
  });

  it("sends channel commands from the channel rocker", async () => {
    const user = userEvent.setup();
    const { value } = renderPad();

    await user.click(screen.getByRole("button", { name: "Channel up" }));
    await user.click(screen.getByRole("button", { name: "Channel down" }));

    expect(value.sendCommand).toHaveBeenCalledWith("CHANNEL_UP");
    expect(value.sendCommand).toHaveBeenCalledWith("CHANNEL_DOWN");
  });

  it("opens YouTube, Prime Video, and Hotstar", async () => {
    const user = userEvent.setup();
    const { value } = renderPad();

    await user.click(screen.getByRole("button", { name: "YouTube" }));
    await user.click(screen.getByRole("button", { name: "Prime Video" }));
    await user.click(screen.getByRole("button", { name: "Hotstar" }));

    expect(value.launchApp).toHaveBeenCalledWith("youtube");
    expect(value.launchApp).toHaveBeenCalledWith("prime-video");
    expect(value.launchApp).toHaveBeenCalledWith("hotstar");
  });

  it("does not launch apps while disabled", async () => {
    const user = userEvent.setup();
    const { value } = renderPad(true);

    await user.click(screen.getByRole("button", { name: "YouTube" }));
    expect(value.launchApp).not.toHaveBeenCalled();
  });

  it("asks to open the keyboard without sending a TV command", async () => {
    const user = userEvent.setup();
    const onOpenKeyboard = vi.fn();
    const { value } = renderPad(false, onOpenKeyboard);

    await user.click(screen.getByRole("button", { name: "Open keyboard" }));
    expect(onOpenKeyboard).toHaveBeenCalledTimes(1);
    expect(value.sendCommand).not.toHaveBeenCalled();
  });
});
