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
    title: "Same Wi‑Fi",
    body: "Keep the TV and phone on one network. Scan, pair, then use the remote.",
  },
];

function HeroRemote() {
  return (
    <div
      className="mx-auto mt-6 w-[min(100%,13.5rem)] border-4 border-ink bg-paper p-4 shadow-[6px_6px_0_#111]"
      aria-hidden="true"
    >
      <div className="mx-auto size-8 rounded-full border-4 border-ink bg-coral" />
      <div className="relative mx-auto mt-3 aspect-square w-[7.25rem]">
        <div className="absolute inset-0 rounded-full bg-ink" />
        <div className="absolute inset-[7px] rounded-full border-[4px] border-ink bg-paper" />
        <div className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-ink bg-accent-strong" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <span className="h-7 border-4 border-ink bg-blue" />
        <span className="h-7 border-4 border-ink bg-accent-strong" />
        <span className="h-7 border-4 border-ink bg-green" />
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="flex flex-col">
      <section className="border-b-[5px] border-ink bg-accent-strong px-5 pb-7 pt-6">
        <p className="inline-block border-4 border-ink bg-paper px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em]">
          iFFALCON
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.35rem,12vw,3.15rem)] uppercase leading-[0.88] tracking-tight">
          TV
          <br />
          Remote
        </h1>
        <p className="mt-4 max-w-[20rem] text-base font-medium leading-7">
          A personal remote for your iFFALCON Android TV. Download the app, pair once, and control
          it from your phone.
        </p>
        <HeroRemote />
        <DownloadAppButton className="mt-7" variant="ink" />
        <p className="mt-3 text-center font-mono text-[11px] font-bold uppercase tracking-wide">
          Android APK. Allow install from this browser if the phone asks.
        </p>
      </section>

      <ul className="flex flex-col gap-4 px-5 py-6">
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
