import { useState, type FormEvent } from "react";
import { Button } from "../../components/Button.js";
import { useHaptics } from "../../hooks/useHaptics.js";
import {
  buildHomeRemoteUrl,
  isPrivateHostname,
  readStoredHomeComputer,
  storeHomeComputer,
  usesCloudBackend,
} from "../../utils/homeNetwork.js";

interface HomeNetworkCardProps {
  hostname?: string;
  cloudBackend?: boolean;
  openHome?: (url: string) => void;
}

export function HomeNetworkCard({
  hostname = window.location.hostname,
  cloudBackend = usesCloudBackend(import.meta.env.VITE_WS_URL ?? ""),
  openHome = (url) => {
    window.location.assign(url);
  },
}: HomeNetworkCardProps) {
  const haptic = useHaptics();
  const [value, setValue] = useState(readStoredHomeComputer);
  const [error, setError] = useState<string | null>(null);

  if (isPrivateHostname(hostname)) {
    return (
      <p
        className="rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm leading-6 text-cyan-50"
        data-testid="lan-install-hint"
      >
        This page is on your Wi‑Fi and can list TVs. Add <strong>this</strong> page to the home
        screen. Remove the internet app — that install cannot see your TVs.
      </p>
    );
  }

  if (!cloudBackend) {
    return null;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const url = buildHomeRemoteUrl(value);
    if (!url) {
      setError("Enter the computer IP from the working :5173 page. Example: 192.168.29.44");
      return;
    }
    setError(null);
    storeHomeComputer(value.trim());
    haptic([8, 20, 8]);
    openHome(url);
  };

  return (
    <form
      className="flex flex-col gap-3 rounded-3xl border border-warn/30 bg-warn/10 p-[clamp(0.9rem,3vw,1.25rem)]"
      onSubmit={onSubmit}
      data-testid="home-network-card"
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/80">
        Home Wi‑Fi
      </h2>
      <p className="text-sm leading-6 text-amber-50/90">
        This home-screen app is the internet copy. It cannot list TVs on your network. Open the
        computer page that already works, then install from there.
      </p>
      <label className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-100/70">
        Computer IP
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="192.168.29.44"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="decimal"
          className="mt-2 min-h-14 w-full rounded-2xl border border-line bg-ink-soft/80 px-4 text-base text-white outline-none placeholder:text-cyan-100/25 focus:border-accent/50"
        />
      </label>
      {error ? <p className="text-sm text-rose-200">{error}</p> : null}
      <Button type="submit">Open on this Wi‑Fi</Button>
    </form>
  );
}
