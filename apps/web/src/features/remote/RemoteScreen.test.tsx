import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RemoteScreen } from "./RemoteScreen.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";
import type { ReactNode } from "react";

const mockTv = {
  id: "mock-iffalcon",
  name: "iFFALCON Living Room",
  host: "127.0.0.1",
  port: 6466,
  brand: "iFFALCON" as const,
  connected: false,
  source: "mock" as const,
};

function renderRemote(overrides: Partial<ConnectionStore> = {}) {
  const value: ConnectionStore = {
    serviceStatus: "open",
    tvState: "DISCONNECTED",
    tv: null,
    devices: [mockTv],
    selectedTvId: mockTv.id,
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
    ...overrides,
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return { ...render(<RemoteScreen />, { wrapper: Wrapper }), value };
}

describe("RemoteScreen", () => {
  it("shows the disconnected TV state", () => {
    renderRemote();
    expect(screen.getByText("iFFALCON Remote")).toBeInTheDocument();
    expect(screen.getByTestId("tv-status")).toHaveTextContent("TV: Not connected");
    expect(screen.getByRole("button", { name: "Connect TV" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Download app" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
  });

  it("lists discovered TVs", () => {
    renderRemote();
    expect(screen.getByText("Available TVs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /iFFALCON Living Room/ })).toBeInTheDocument();
    expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
  });

  it("connects the selected TV", async () => {
    const user = userEvent.setup();
    const { value } = renderRemote();

    await user.click(screen.getByRole("button", { name: "Connect TV" }));
    expect(value.connectTv).toHaveBeenCalledTimes(1);
  });

  it("sends HOME from the remote pad after the TV is connected", async () => {
    const user = userEvent.setup();
    const { value } = renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
      lastCommand: "HOME",
    });

    expect(screen.getByTestId("tv-status")).toHaveTextContent("TV: Connected");
    expect(screen.queryByText("iFFALCON Remote")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disconnect" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(value.resetApp).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(value.sendCommand).toHaveBeenCalledWith("HOME");
    expect(screen.queryByRole("button", { name: /^Keyboard$/ })).not.toBeInTheDocument();
  });

  it("opens the remote as soon as a TV connection starts", () => {
    renderRemote({
      tvState: "CONNECTING",
      tv: { ...mockTv, connected: false },
    });

    expect(screen.getByRole("button", { name: "Remote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
    expect(screen.queryByText("iFFALCON Remote")).not.toBeInTheDocument();
    expect(screen.getByTestId("tv-status")).toHaveTextContent("TV: Connecting");
  });

  it("resets saved data from connecting and reconnecting", async () => {
    const user = userEvent.setup();
    const connecting = renderRemote({
      tvState: "CONNECTING",
      tv: { ...mockTv, connected: false },
    });
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(connecting.value.resetApp).toHaveBeenCalledTimes(1);

    connecting.unmount();
    const reconnecting = renderRemote({
      tvState: "RECONNECTING",
      tv: { ...mockTv, connected: false },
    });
    expect(screen.getByTestId("tv-status")).toHaveTextContent("TV: Check connection");
    expect(
      screen.getByText("Check the connection. The TV and phone must be on the same Wi‑Fi."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(reconnecting.value.resetApp).toHaveBeenCalledTimes(1);
  });

  it("opens a typing preview on the same remote page", async () => {
    const user = userEvent.setup();
    const { value } = renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
    });

    await user.click(screen.getByRole("button", { name: "Open keyboard" }));
    expect(screen.getByRole("button", { name: "Remote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Typing preview" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close keyboard" })).not.toBeInTheDocument();
    const input = screen.getByPlaceholderText("Type here…");
    expect(input).toHaveClass("text-transparent");
    await user.type(input, "hello");
    await waitFor(() => {
      expect(value.sendText).toHaveBeenCalledTimes(5);
    });
    expect(value.sendText).toHaveBeenNthCalledWith(1, "h");
    expect(value.sendText).toHaveBeenNthCalledWith(5, "o");
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    fireEvent.blur(input);
    expect(screen.queryByPlaceholderText("Type here…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
  });

  it("opens the touchpad panel while connected", async () => {
    const user = userEvent.setup();
    renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
    });

    await user.click(screen.getByRole("button", { name: "Touchpad" }));
    expect(screen.getByTestId("touchpad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open keyboard" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open keyboard" }));
    expect(screen.queryByRole("dialog", { name: "Typing preview" })).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type here…")).toBeInTheDocument();
    expect(screen.getByTestId("touchpad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Touchpad" })).toBeInTheDocument();
  });

  it("does not open the keyboard until the user taps Keyboard", () => {
    renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
      imeActive: true,
    });

    expect(screen.queryByRole("dialog", { name: "Typing preview" })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Type here…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open keyboard" })).toBeInTheDocument();
  });

  it("shows the pairing form while waiting for a PIN", () => {
    renderRemote({
      tvState: "PAIRING",
      tv: { ...mockTv, host: "192.168.1.40", source: "mdns" },
    });
    expect(screen.getByRole("button", { name: "Submit PIN" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Connect TV" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Home" })).not.toBeInTheDocument();
  });

  it("shows a useful message when the local service is down", () => {
    renderRemote({ serviceStatus: "closed" });
    expect(screen.getByText("Local service unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Connect TV" })).toBeDisabled();
  });

  it("shows an empty discovery state", () => {
    renderRemote({ devices: [], selectedTvId: null });
    expect(screen.getByTestId("tv-empty")).toHaveTextContent("No TVs found");
    expect(screen.getByRole("button", { name: "Connect TV" })).toBeDisabled();
  });

  it("connects with a typed IP address", async () => {
    const user = userEvent.setup();
    const { value } = renderRemote();

    await user.type(screen.getByPlaceholderText("192.168.1.40"), "192.168.1.40");
    await user.click(screen.getByRole("button", { name: "Connect with IP" }));
    expect(value.connectTv).toHaveBeenCalledWith({
      id: "manual:192.168.1.40",
      host: "192.168.1.40",
    });
  });
});
