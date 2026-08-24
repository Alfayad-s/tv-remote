import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function TvList() {
  const { devices, selectedTvId, discoveryStatus, tvState, selectTv } = useConnection();
  const haptic = useHaptics();
  const connected = tvState === "CONNECTED";
  const pairing = tvState === "PAIRING";

  if (connected || pairing) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-line bg-glass p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
          Available TVs
        </h2>
        {discoveryStatus === "searching" ? (
          <span className="text-xs text-warn">Scanning…</span>
        ) : null}
      </div>

      {discoveryStatus === "done" && devices.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-cyan-100/65" data-testid="tv-empty">
          No TVs found on this network. The TV may be off, on a different Wi-Fi, or blocking mDNS.
          Enter its IP address below.
        </p>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2">
        {devices.map((device) => {
          const selected = device.id === selectedTvId;
          return (
            <li key={device.id}>
              <button
                type="button"
                onClick={() => {
                  haptic();
                  selectTv(device.id);
                }}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selected
                    ? "border-accent/50 bg-accent/10"
                    : "border-line bg-ink-soft/70 hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-white">{device.name}</p>
                  <span className="text-xs text-cyan-100/50">
                    {device.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-cyan-100/55">{device.host}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100/35">
                  {device.source === "mock"
                    ? "Mock device"
                    : (device.serviceType ?? device.brand ?? "Android TV")}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
