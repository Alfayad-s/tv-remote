import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { PairingForm } from "./PairingForm.js";
import { ConnectionContext, type ConnectionStore } from "../../store/connectionContext.js";

const pairingTv = {
  id: "mdns:192.168.1.40:6466",
  name: "iFFALCON Living Room",
  host: "192.168.1.40",
  port: 6466,
  brand: "iFFALCON" as const,
  connected: false,
  source: "mdns" as const,
};

function renderPairing(overrides: Partial<ConnectionStore> = {}) {
  const value: ConnectionStore = {
    serviceStatus: "open",
    tvState: "PAIRING",
    tv: pairingTv,
    devices: [pairingTv],
    selectedTvId: pairingTv.id,
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
    ...overrides,
  };

  function Wrapper({ children }: { children: ReactNode }) {
    return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
  }

  return { ...render(<PairingForm />, { wrapper: Wrapper }), value };
}

describe("PairingForm", () => {
  it("is hidden unless the TV is pairing", () => {
    renderPairing({ tvState: "CONNECTED", tv: { ...pairingTv, connected: true } });
    expect(screen.queryByRole("button", { name: "Submit PIN" })).not.toBeInTheDocument();
  });

  it("submits a hexadecimal PIN", async () => {
    const user = userEvent.setup();
    const { value } = renderPairing();

    await user.type(screen.getByPlaceholderText("ABCD12"), "ab cd-12");
    await user.click(screen.getByRole("button", { name: "Submit PIN" }));
    expect(value.submitPin).toHaveBeenCalledWith("ABCD12");
  });

  it("explains an invalid PIN instead of doing nothing", async () => {
    const user = userEvent.setup();
    const { value } = renderPairing();

    await user.type(screen.getByPlaceholderText("ABCD12"), "GHIJKL");
    await user.click(screen.getByRole("button", { name: "Submit PIN" }));
    expect(value.submitPin).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/0-9 and A-F/i);
  });

  it("cancels pairing without submitting a PIN", async () => {
    const user = userEvent.setup();
    const { value } = renderPairing();

    await user.click(screen.getByRole("button", { name: "Cancel pairing" }));
    expect(value.disconnectTv).toHaveBeenCalledTimes(1);
    expect(value.submitPin).not.toHaveBeenCalled();
  });
});
