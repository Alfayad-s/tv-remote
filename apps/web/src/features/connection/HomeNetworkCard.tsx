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
        className="border-4 border-ink bg-green px-4 py-3 text-sm leading-6"
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
      className="flex flex-col gap-3 border-4 border-ink bg-accent-strong p-4 shadow-[5px_5px_0_#111]"
      onSubmit={onSubmit}
      data-testid="home-network-card"
    >
      <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
        Home Wi‑Fi
      </h2>
      <p className="text-sm leading-6">
        This home-screen app is the internet copy. It cannot list TVs on your network. Open the
        computer page that already works, then install from there.
      </p>
      <label className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
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
          className="mt-2 min-h-14 w-full border-4 border-ink bg-paper px-4 font-sans text-base text-ink outline-none placeholder:text-ink/35"
        />
      </label>
      {error ? <p className="text-sm font-bold text-coral">{error}</p> : null}
      <Button type="submit">Open on this Wi‑Fi</Button>
    </form>
  );
}
