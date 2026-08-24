import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function ConnectButton() {
  const { serviceStatus, tvState, selectedTvId, connectTv, disconnectTv } = useConnection();
  const haptic = useHaptics();
  const serviceReady = serviceStatus === "open";
  const connected = tvState === "CONNECTED";
  const pairing = tvState === "PAIRING";
  const busy = tvState === "CONNECTING" || tvState === "RECONNECTING";

  if (connected) {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          haptic();
          disconnectTv();
        }}
      >
        Disconnect
      </Button>
    );
  }

  if (pairing) {
    return null;
  }

  return (
    <Button
      disabled={!serviceReady || busy || !selectedTvId}
      onClick={() => {
        haptic([8, 20, 8]);
        connectTv();
      }}
    >
      {busy ? "Connecting…" : "Connect TV"}
    </Button>
  );
}
