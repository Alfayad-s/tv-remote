import { useEffect, useRef, useState } from "react";
import type { DeskApp } from "@tv-remote/streamdesk-protocol";
import { STREAMDESK_DEFAULT_PORT } from "@tv-remote/streamdesk-protocol";
import { DeskClient, readSession, clearSession, type DeskStatus } from "./deskClient.js";

function statusLabel(status: DeskStatus): string {
  switch (status) {
    case "connecting":
      return "Connecting…";
    case "needs_pin":
      return "Enter PIN";
    case "connected":
      return "Connected";
    case "error":
      return "Error";
    default:
      return "Not connected";
  }
}

function guessMacHost(savedHost: string | undefined): string {
  if (savedHost) {
    return savedHost;
  }
  if (typeof window === "undefined") {
    return "";
  }
  const hostname = window.location.hostname;
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return "";
  }
  return hostname;
}

export default function App() {
  const saved = readSession();
  const [host, setHost] = useState(() => guessMacHost(saved?.host));
  const [port, setPort] = useState(String(saved?.port ?? STREAMDESK_DEFAULT_PORT));
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<DeskStatus>("idle");
  const [hostName, setHostName] = useState("Mac");
  const [error, setError] = useState<string | null>(null);
  const [desk, setDesk] = useState<DeskApp[]>([]);
  const clientRef = useRef<DeskClient | null>(null);

  useEffect(() => {
    const client = new DeskClient({
      onStatus: setStatus,
      onHostName: setHostName,
      onApps: (deskApps) => {
        setDesk(deskApps);
      },
      onError: setError,
      onPaired: () => {
        setError(null);
      },
    });
    clientRef.current = client;
    const session = readSession();
    if (session?.host && session.token) {
      client.connect(session.host, session.port, session.token);
    }
    return () => client.disconnect();
  }, []);

  const connect = (): void => {
    setError(null);
    const parsedPort = Number(port) || STREAMDESK_DEFAULT_PORT;
    clientRef.current?.connect(host, parsedPort, null, pin.length === 6 ? pin : null);
  };

  const disconnect = (): void => {
    clearSession();
    clientRef.current?.disconnect();
    setDesk([]);
    setStatus("idle");
  };

  const showConnectForm =
    status === "idle" || status === "error" || status === "connecting" || status === "needs_pin";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x-[5px] border-ink bg-paper">
      <header className="border-b-[5px] border-ink bg-ink px-4 py-3 text-paper">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]">StreamDesk</p>
        <h1 className="mt-1 font-display text-2xl uppercase leading-none">Mac remote</h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wide text-paper/70">
          {hostName} · {statusLabel(status)}
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        {showConnectForm ? (
          <section className="border-4 border-ink bg-paper p-4 shadow-[5px_5px_0_#111]">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Connect</p>
            <label className="mt-3 block text-sm font-bold">
              Mac IP
              <input
                className="mt-1 w-full border-4 border-ink bg-paper px-3 py-2 font-mono text-sm"
                value={host}
                placeholder="10.225.92.24"
                onChange={(event) => setHost(event.target.value)}
              />
            </label>
            <label className="mt-3 block text-sm font-bold">
              Port
              <input
                className="mt-1 w-full border-4 border-ink bg-paper px-3 py-2 font-mono text-sm"
                value={port}
                onChange={(event) => setPort(event.target.value)}
              />
            </label>
            <label className="mt-3 block text-sm font-bold">
              PIN from Mac terminal
              <input
                className="mt-1 w-full border-4 border-ink bg-paper px-3 py-2 text-center font-mono text-2xl tracking-[0.3em]"
                value={pin}
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </label>
            <button
              type="button"
              className="brutal-press mt-4 min-h-12 w-full border-[3px] border-ink bg-accent-strong font-bold uppercase shadow-[4px_4px_0_#111] disabled:opacity-40"
              disabled={!host.trim() || pin.length !== 6 || status === "connecting"}
              onClick={connect}
            >
              {status === "connecting" ? "Connecting…" : "Connect"}
            </button>
            <p className="mt-3 text-sm leading-6 text-ink/70">
              Use the same IP as this page ({typeof window !== "undefined" ? window.location.hostname : "…"})
              and the 6-digit PIN printed where you ran{" "}
              <span className="font-mono">npm run streamdesk:desk</span>.
            </p>
          </section>
        ) : null}

        {error ? (
          <p className="border-4 border-ink bg-coral px-4 py-3 text-sm font-bold">{error}</p>
        ) : null}

        {status === "connected" ? (
          <>
            <div className="flex gap-2">
              <button
                type="button"
                className="brutal-press min-h-11 flex-1 border-[3px] border-ink bg-paper text-sm font-bold uppercase shadow-[3px_3px_0_#111]"
                onClick={() => clientRef.current?.refresh()}
              >
                Refresh
              </button>
              <button
                type="button"
                className="brutal-press min-h-11 flex-1 border-[3px] border-ink bg-coral text-sm font-bold uppercase shadow-[3px_3px_0_#111]"
                onClick={disconnect}
              >
                Disconnect
              </button>
            </div>

            <section className="pb-6">
              <h2 className="font-display text-lg uppercase">Your apps</h2>
              <p className="mt-1 text-sm text-ink/70">
                Only apps you add on the Mac desk (
                <span className="font-mono">http://{host}:{port}/</span>).
              </p>
              {desk.length === 0 ? (
                <p className="mt-3 border-4 border-ink bg-paper px-4 py-3 text-sm font-bold">
                  Nothing here yet. On the Mac, open the arrange page, tap Add on the apps you want,
                  then tap Refresh here.
                </p>
              ) : (
                <ul className="mt-3 grid grid-cols-3 gap-3">
                  {desk.map((app) => (
                    <DeskTile
                      key={`desk-${app.id}`}
                      app={app}
                      onOpen={() =>
                        app.running
                          ? clientRef.current?.activate(app.id)
                          : clientRef.current?.launch(app.id)
                      }
                      onClose={() => clientRef.current?.quit(app.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

function DeskTile({
  app,
  onOpen,
  onClose,
}: {
  app: DeskApp;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <li className="border-4 border-ink bg-paper p-2 shadow-[4px_4px_0_#111]">
      <button type="button" className="flex w-full flex-col items-center gap-2" onClick={onOpen}>
        {app.iconUrl ? (
          <img src={app.iconUrl} alt="" className="size-14 rounded-xl border-2 border-ink" />
        ) : (
          <span className="grid size-14 place-items-center rounded-xl border-2 border-ink bg-accent-strong font-display text-xl">
            {app.name.slice(0, 1)}
          </span>
        )}
        <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{app.name}</span>
      </button>
      {app.running ? (
        <button
          type="button"
          className="brutal-press mt-2 min-h-8 w-full border-[2px] border-ink bg-coral text-[10px] font-bold uppercase"
          onClick={onClose}
        >
          Close
        </button>
      ) : null}
    </li>
  );
}
