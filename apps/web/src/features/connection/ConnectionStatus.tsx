import { StatusDot } from "../../components/StatusDot.js";
import { useConnection } from "../../hooks/useConnection.js";
import { tvStateLabel } from "../../utils/labels.js";

export function ConnectionStatus() {
  const { tv, tvState } = useConnection();
  const name = tv?.name ?? "Android TV";

  return (
    <section className="border-4 border-ink bg-paper p-4 shadow-[5px_5px_0_#111]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">Television</p>
          <h2 className="mt-2 font-display text-xl uppercase">{name}</h2>
        </div>
        <StatusDot state={tvState} />
      </div>
      <p className="mt-4 font-mono text-sm font-bold uppercase" data-testid="tv-status">
        TV: {tvStateLabel(tvState)}
      </p>
      {tv?.host ? <p className="mt-1 font-mono text-xs">{tv.host}</p> : null}
    </section>
  );
}
