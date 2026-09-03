import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpeakerScreen } from "./SpeakerScreen.js";
import type * as BtAudioModule from "../../native/btAudio.js";
import type { SpeakerState } from "../../native/btAudio.js";

const { native, plugin } = vi.hoisted(() => ({
  native: { android: true },
  plugin: {
    getState: vi.fn(),
    requestBluetoothName: vi.fn(),
    setVolume: vi.fn(),
    adjustVolume: vi.fn(),
    setMuted: vi.fn(),
    mediaKey: vi.fn(),
    openSystemEqualizer: vi.fn(),
    openBluetoothSettings: vi.fn(),
    addListener: vi.fn(),
  },
}));

vi.mock("../../native/platform.js", () => ({
  isNativeAndroid: () => native.android,
}));

vi.mock("../../native/btAudio.js", async (importOriginal) => ({
  ...(await importOriginal<typeof BtAudioModule>()),
  BtAudio: plugin,
}));

const CONNECTED: SpeakerState = {
  connected: true,
  deviceName: "JBL Flip 6",
  volume: 6,
  maxVolume: 15,
  muted: false,
  toneTarget: "effects",
};

async function renderSpeaker(state: Partial<SpeakerState> = {}) {
  const resolved = { ...CONNECTED, ...state };
  plugin.requestBluetoothName.mockResolvedValue(resolved);
  for (const method of [plugin.setVolume, plugin.adjustVolume, plugin.setMuted]) {
    method.mockResolvedValue(resolved);
  }
  plugin.mediaKey.mockResolvedValue(undefined);
  plugin.openSystemEqualizer.mockResolvedValue(undefined);
  plugin.openBluetoothSettings.mockResolvedValue(undefined);

  const onBack = vi.fn();
  const view = render(<SpeakerScreen onBack={onBack} />);
  await waitFor(() => {
    expect(screen.getByTestId("speaker-status")).not.toHaveTextContent("Checking…");
  });
  return { ...view, onBack };
}

describe("SpeakerScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    native.android = true;
    plugin.addListener.mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) });
  });

  it("names the connected speaker and shows its volume", async () => {
    await renderSpeaker();
    expect(screen.getByText("JBL Flip 6")).toBeInTheDocument();
    expect(screen.getByTestId("speaker-status")).toHaveTextContent("Speaker: Connected");
    expect(screen.getByTestId("speaker-volume")).toHaveTextContent("40%");
  });

  it("falls back to a generic name when the Bluetooth permission is denied", async () => {
    await renderSpeaker({ deviceName: null });
    expect(screen.getByText("Bluetooth speaker")).toBeInTheDocument();
  });

  it("sends the volume, mute and track controls", async () => {
    const user = userEvent.setup();
    await renderSpeaker();

    await user.click(screen.getByRole("button", { name: "Volume up" }));
    expect(plugin.adjustVolume).toHaveBeenCalledWith({ direction: "up" });

    await user.click(screen.getByRole("button", { name: "Mute" }));
    expect(plugin.setMuted).toHaveBeenCalledWith({ muted: true });

    await user.click(screen.getByRole("button", { name: "Next track" }));
    expect(plugin.mediaKey).toHaveBeenCalledWith({ key: "next" });

    await user.click(screen.getByRole("button", { name: "Previous track" }));
    expect(plugin.mediaKey).toHaveBeenCalledWith({ key: "previous" });

    fireEvent.change(screen.getByLabelText("Volume"), { target: { value: "12" } });
    expect(plugin.setVolume).toHaveBeenCalledWith({ level: 12 });
  });

  it("sends tone control to the system equalizer instead of faking its own", async () => {
    const user = userEvent.setup();
    await renderSpeaker();

    expect(screen.queryByLabelText("Bass")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Treble")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "System equalizer" }));
    expect(plugin.openSystemEqualizer).toHaveBeenCalledTimes(1);
  });

  it("offers sound settings when the phone has no effect panel", async () => {
    const user = userEvent.setup();
    await renderSpeaker({ toneTarget: "sound" });

    expect(screen.queryByRole("button", { name: "System equalizer" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sound settings" }));
    expect(plugin.openSystemEqualizer).toHaveBeenCalledTimes(1);
  });

  it("points at the music app when the phone has no equalizer at all", async () => {
    await renderSpeaker({ toneTarget: null });

    expect(screen.queryByRole("button", { name: "System equalizer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sound settings" })).not.toBeInTheDocument();
    expect(screen.getByText(/use the one inside your music app/i)).toBeInTheDocument();
  });

  it("unmutes by restoring the volume rather than toggling a flag", async () => {
    const user = userEvent.setup();
    await renderSpeaker({ muted: true, volume: 0 });

    expect(screen.getByTestId("speaker-volume")).toHaveTextContent("Muted");
    await user.click(screen.getByRole("button", { name: "Unmute" }));
    expect(plugin.setMuted).toHaveBeenCalledWith({ muted: false });
  });

  it("sends the user to Android settings when no speaker is connected", async () => {
    const user = userEvent.setup();
    await renderSpeaker({ connected: false, deviceName: null });

    expect(screen.getByTestId("speaker-status")).toHaveTextContent("Speaker: Not connected");
    expect(screen.queryByRole("button", { name: "Mute" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open Bluetooth settings" }));
    expect(plugin.openBluetoothSettings).toHaveBeenCalledTimes(1);
  });

  it("explains that the browser cannot control the speaker", async () => {
    native.android = false;
    const user = userEvent.setup();
    render(<SpeakerScreen onBack={vi.fn()} />);

    expect(screen.getByTestId("speaker-status")).toHaveTextContent("Android app only");
    expect(plugin.requestBluetoothName).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Back" }));
  });

  it("goes back to the TV remote", async () => {
    const user = userEvent.setup();
    const { onBack } = await renderSpeaker();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
