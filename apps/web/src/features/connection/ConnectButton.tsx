import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { serviceStatus, tvState, selectedTvId, connectTv, disconnectTv, resetApp } =
    useConnection();
  const haptic = useHaptics();
  const serviceReady = serviceStatus === "open";
  const connected = tvState === "CONNECTED";
  const pairing = tvState === "PAIRING";
  const busy = tvState === "CONNECTING" || tvState === "RECONNECTING" || tvState === "ERROR";
  const size = compact ? "sm" : "md";

  if (connected) {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={() => {
          haptic();
          resetApp();
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
      <div className={`flex shrink-0 items-center gap-2 ${compact ? "" : "w-full"}`}>
        <Button
          variant="danger"
          size={size}
          className={compact ? "" : "flex-1"}
          onClick={() => {
            haptic();
            resetApp();
          }}
        >
          Reset
        </Button>
        <Button
          variant="ghost"
          size={size}
          className={compact ? "" : "flex-1"}
          onClick={() => {
            haptic();
            disconnectTv();
          }}
        >
          Cancel
        </Button>
      </div>
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
