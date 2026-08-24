import { StatusDot } from "../../components/StatusDot.js";
import { useConnection } from "../../hooks/useConnection.js";
import { tvStateLabel } from "../../utils/labels.js";

export function ConnectionStatus() {
  const { tv, tvState } = useConnection();
  const name = tv?.name ?? "iFFALCON TV";

  return (
    <section className="rounded-3xl border border-line bg-glass p-[clamp(0.9rem,3vw,1.25rem)] shadow-[inset_0_1px_0_rgb(255_255_255_/_0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Television</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{name}</h2>
        </div>
        <StatusDot state={tvState} />
      </div>
      <p className="mt-4 text-sm text-cyan-100/75" data-testid="tv-status">
        TV: {tvStateLabel(tvState)}
      </p>
      {tv?.host ? <p className="mt-1 font-mono text-xs text-cyan-100/45">{tv.host}</p> : null}
    </section>
  );
}
