import { DownloadAppButton } from "./DownloadAppButton.js";

const FEATURES = [
  {
    title: "Phone remote",
    body: "Control your iFFALCON Android TV from your phone on the same Wi‑Fi.",
  },
  {
    title: "No laptop needed",
    body: "The Android app talks to the TV directly. Pair once with the code on the TV.",
  },
  {
    title: "Use in a browser",
    body: "You can also open the web remote on this network if the local service is running.",
  },
];

export function LandingPage({ onOpenRemote }: { onOpenRemote: () => void }) {
  return (
    <main className="flex flex-col px-5 pb-8 pt-6">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em]">iFFALCON</p>
      <h1 className="mt-3 font-display text-[clamp(2rem,8vw,2.75rem)] uppercase leading-none">
        TV Remote
      </h1>
      <p className="mt-4 max-w-md text-base leading-7">
        A personal remote for your iFFALCON Android TV. Download the Android app, or open the web
        remote in this browser.
      </p>

      <DownloadAppButton className="mt-8" />
      <p className="mt-3 text-center font-mono text-[11px] font-bold uppercase tracking-wide text-ink/55">
        Android APK. Allow install from this browser if the phone asks.
      </p>

      <button
        type="button"
        className="brutal-press mt-3 flex min-h-14 w-full items-center justify-center border-[4px] border-ink bg-paper px-5 text-base font-bold uppercase shadow-[5px_5px_0_#111]"
        onClick={onOpenRemote}
      >
        Open web remote
      </button>

      <ul className="mt-10 flex flex-col gap-3">
        {FEATURES.map((feature) => (
          <li key={feature.title} className="border-4 border-ink bg-paper px-5 py-4 shadow-[5px_5px_0_#111]">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">
              {feature.title}
            </h2>
            <p className="mt-2 text-sm leading-6">{feature.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
