import { render, screen, waitFor } from "@testing-library/react";
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
    sendCommand: vi.fn(),
    sendText: vi.fn(),
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
    await user.click(screen.getByRole("button", { name: "Home" }));
    expect(value.sendCommand).toHaveBeenCalledWith("HOME");
  });

  it("opens the keyboard panel while connected", async () => {
    const user = userEvent.setup();
    const { value } = renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
    });

    await user.click(screen.getByRole("button", { name: "Keyboard" }));
    await user.type(screen.getByPlaceholderText("Search or type…"), "hello");
    await waitFor(() => {
      expect(value.sendText).toHaveBeenCalledWith("hello");
    });
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
  });

  it("opens the touchpad panel while connected", async () => {
    const user = userEvent.setup();
    renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
    });

    await user.click(screen.getByRole("button", { name: "Touchpad" }));
    expect(screen.getByTestId("touchpad")).toBeInTheDocument();
    expect(screen.getByText(/Swipe to move around the TV/)).toBeInTheDocument();
  });

  it("opens the keyboard when the TV shows a text field", async () => {
    renderRemote({
      tvState: "CONNECTED",
      tv: { ...mockTv, connected: true },
      imeActive: true,
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search or type…")).toBeInTheDocument();
    });
    expect(screen.getByText(/The TV is waiting for text/)).toBeInTheDocument();
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
