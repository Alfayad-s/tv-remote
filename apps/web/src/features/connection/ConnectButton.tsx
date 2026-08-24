import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { serviceStatus, tvState, tv, selectedTvId, connectTv, disconnectTv } = useConnection();
  const haptic = useHaptics();
  const serviceReady = serviceStatus === "open";
  const connected = tvState === "CONNECTED";
  const pairing = tvState === "PAIRING";
  const busy = tvState === "CONNECTING" || tvState === "RECONNECTING";
  const size = compact ? "sm" : "md";

  if (connected || (tvState === "ERROR" && tv)) {
    return (
      <Button
        variant="ghost"
        size={size}
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
        size={size}
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
