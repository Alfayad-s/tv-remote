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

  if (busy) {
    return (
      <Button
        variant="ghost"
        onClick={() => {
          haptic();
          disconnectTv();
        }}
      >
        Cancel
      </Button>
    );
  }

  return (
    <Button
      disabled={!serviceReady || !selectedTvId}
      onClick={() => {
        haptic([8, 20, 8]);
        connectTv();
      }}
    >
      Connect TV
    </Button>
  );
}
