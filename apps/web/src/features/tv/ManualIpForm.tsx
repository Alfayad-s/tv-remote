import { useState, type FormEvent } from "react";
import { parseTvTarget } from "@tv-remote/shared";
import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function ManualIpForm() {
  const { serviceStatus, tvState, connectTv } = useConnection();
  const haptic = useHaptics();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (tvState === "CONNECTED" || tvState === "PAIRING") {
    return null;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseTvTarget(value);
    if (!parsed) {
      setError("Enter an IPv4 address, optionally with a port. Example: 192.168.1.40");
      return;
    }
    setError(null);
    haptic([8, 20, 8]);
    connectTv({
      id: `manual:${parsed.host}`,
      host: parsed.host,
      ...(parsed.port === undefined ? {} : { port: parsed.port }),
    });
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <label className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
        Manual IP
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="192.168.1.40"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="decimal"
          className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-ink-soft/80 px-4 text-base text-white outline-none placeholder:text-cyan-100/25 focus:border-accent/50"
        />
      </label>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <Button type="submit" variant="ghost" disabled={serviceStatus !== "open"}>
        Connect with IP
      </Button>
    </form>
  );
}
