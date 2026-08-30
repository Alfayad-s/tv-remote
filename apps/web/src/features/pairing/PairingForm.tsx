import { useEffect, useState, type FormEvent } from "react";
import { normalizePairingPin } from "@tv-remote/shared";
import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import { useConnection } from "../../hooks/useConnection.js";

export function PairingForm() {
  const { serviceStatus, tvState, tv, lastError, submitPin, disconnectTv } = useConnection();
  const haptic = useHaptics();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tvState !== "PAIRING" || lastError) {
      setSubmitting(false);
    }
  }, [lastError, tvState]);

  if (tvState !== "PAIRING") {
    return null;
  }

  const sendPin = (raw: string): void => {
    const pin = normalizePairingPin(raw);
    if (!pin) {
      setError("Enter the code shown on the TV. It is usually 6 characters: 0-9 and A-F.");
      setSubmitting(false);
      return;
    }
    setError(null);
    haptic([8, 20, 8]);
    setSubmitting(true);
    if (submitPin(pin) === false) {
      setSubmitting(false);
      setError("Could not reach the local service. Try submitting the code again.");
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fromForm = new FormData(event.currentTarget).get("pin");
    sendPin(typeof fromForm === "string" ? fromForm : value);
  };

  return (
    <form
      className="flex flex-col gap-3 border-4 border-ink bg-accent-strong p-4 shadow-[5px_5px_0_#111]"
      onSubmit={onSubmit}
    >
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">Pairing</p>
        <h2 className="mt-2 font-display text-xl uppercase">Enter the TV code</h2>
        <p className="mt-2 text-sm leading-6">
          Look at {tv?.name ?? "the TV"}. Type the pairing code shown on screen. It is usually 6
          characters using 0-9 and A-F.
        </p>
      </div>
      <label className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
        Pairing code
        <input
          name="pin"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="ABCD12"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          enterKeyHint="done"
          inputMode="text"
          maxLength={16}
          className="mt-2 min-h-14 w-full border-4 border-ink bg-paper px-4 font-mono text-lg tracking-[0.3em] text-ink outline-none placeholder:text-ink/35"
        />
      </label>
      {error ? (
        <p className="text-sm font-bold text-coral" role="alert">
          {error}
        </p>
      ) : null}
      {submitting && !error ? (
        <p className="text-sm">Checking the code on the TV…</p>
      ) : null}
      <Button type="submit" disabled={serviceStatus !== "open" || submitting}>
        {submitting ? "Submitting…" : "Submit PIN"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          haptic();
          disconnectTv();
        }}
      >
        Cancel pairing
      </Button>
    </form>
  );
}
