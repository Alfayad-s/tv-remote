import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { RemotePad } from "./RemotePad.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";

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
    sendCommand: vi.fn(),
    sendText: vi.fn(),
    submitPin: vi.fn(),
    discoverTvs: vi.fn(),
    selectTv: vi.fn(),
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return { ...render(<RemotePad disabled={disabled} />, { wrapper: Wrapper }), value };
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

  it("includes a touchpad at the bottom of the remote", () => {
    renderPad();
    expect(screen.getByTestId("touchpad")).toBeInTheDocument();
    expect(screen.getByLabelText("Remote touchpad")).toBeInTheDocument();
  });
});
