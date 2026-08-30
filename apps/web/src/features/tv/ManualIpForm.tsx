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
      <label className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
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
          className="mt-2 min-h-14 w-full border-4 border-ink bg-paper px-4 font-sans text-base text-ink outline-none placeholder:text-ink/35"
        />
      </label>
      {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
      <Button
        type="submit"
        variant="ghost"
        disabled={serviceStatus !== "open" || tvState === "CONNECTING" || tvState === "RECONNECTING"}
      >
        Connect with IP
      </Button>
    </form>
  );
}
