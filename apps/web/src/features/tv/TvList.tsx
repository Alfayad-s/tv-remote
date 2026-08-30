import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";
import { isNativeAndroid } from "../../native/platform.js";

export function TvList() {
  const { devices, selectedTvId, discoveryStatus, tvState, selectTv } = useConnection();
  const haptic = useHaptics();
  const connected = tvState === "CONNECTED";
  const pairing = tvState === "PAIRING";

  if (connected || pairing) {
    return null;
  }

  return (
    <section className="border-4 border-ink bg-paper p-4 shadow-[5px_5px_0_#111]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
          Available TVs
        </h2>
        {discoveryStatus === "searching" ? (
          <span className="font-mono text-xs font-bold uppercase">Scanning…</span>
        ) : null}
      </div>

      {discoveryStatus === "done" && devices.length === 0 ? (
        <p className="mt-4 text-sm leading-6" data-testid="tv-empty">
          {isNativeAndroid()
            ? "No TVs found. Join the same Wi‑Fi as the TV (not guest), allow Nearby devices if the phone asks, then Scan again. Or type the TV IP below."
            : "No TVs found on this network. If the :5173 page on your computer lists TVs, this install is the internet copy — open that computer address on the phone and add it to the home screen. Otherwise the TV may be off, on a different Wi-Fi, or blocking mDNS."}
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
                className={`w-full border-4 border-ink px-4 py-3 text-left shadow-[4px_4px_0_#111] ${
                  selected ? "bg-accent-strong" : "bg-paper"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold uppercase">{device.name}</p>
                  <span className="font-mono text-xs font-bold uppercase">
                    {device.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs">{device.host}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/50">
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
