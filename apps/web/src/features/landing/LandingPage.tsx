import { DownloadAppButton } from "./DownloadAppButton.js";
import { SiteNav } from "./SiteNav.js";

const ALFAYAD_URL = "https://alfayad.vercel.app";

const FEATURES = [
  {
    n: "01",
    tone: "bg-accent-strong",
    title: "Phone remote",
    body: "Control any Android TV from your phone on the same Wi‑Fi.",
  },
  {
    n: "02",
    tone: "bg-paper",
    title: "Scan and pair",
    body: "Find TVs on the network, or enter an IP. Pair once with the code on the TV.",
  },
  {
    n: "03",
    tone: "bg-blue text-paper",
    title: "Full remote pad",
    body: "Power, Home, D‑pad, volume, channel, mute, and playback keys.",
  },
  {
    n: "04",
    tone: "bg-coral",
    title: "App shortcuts",
    body: "Jump to apps on the TV from the remote pad.",
  },
  {
    n: "05",
    tone: "bg-paper",
    title: "Touchpad",
    body: "Swipe to move focus, tap to select, long-press OK. Slow, normal, or fast.",
  },
  {
    n: "06",
    tone: "bg-green",
    title: "Volume strip",
    body: "Swipe up or down on the touchpad volume bar to change TV volume.",
  },
  {
    n: "07",
    tone: "bg-violet text-paper",
    title: "Keyboard",
    body: "Tap the keyboard icon to type on the TV with your phone keyboard.",
  },
  {
    n: "08",
    tone: "bg-paper",
    title: "Stays connected",
    body: "The Android app keeps the TV session alive and reconnects if the link drops.",
  },
  {
    n: "09",
    tone: "bg-accent-strong",
    title: "Reset and help",
    body: "Reset wipes the session. If it cannot connect, the app reminds you to use the same Wi‑Fi.",
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

export function LandingPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <main className="flex flex-col">
      <SiteNav current="home" onGo={onGo} />

      <section className="border-y-[5px] border-ink bg-accent-strong px-5 pb-7 pt-6">
        <p className="inline-block border-4 border-ink bg-paper px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em]">
          Android TV
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.35rem,12vw,3.15rem)] uppercase leading-[0.88] tracking-tight">
          TV
          <br />
          Remote
        </h1>
        <p className="mt-4 max-w-[20rem] text-base font-medium leading-7">
          A phone remote for Android TV. Download the app, pair once, and control the TV from your
          pocket.
        </p>
        <HeroRemote />
        <DownloadAppButton className="mt-7" variant="ink" />
        <p className="mt-3 text-center font-mono text-[11px] font-bold uppercase tracking-wide">
          Android APK. Allow install from this browser if the phone asks.
        </p>
      </section>

      <section className="border-b-[5px] border-ink bg-blue px-5 py-6 text-paper">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-paper/70">
          Also from this site
        </p>
        <h2 className="mt-2 font-display text-2xl uppercase leading-none">StreamDesk</h2>
        <p className="mt-3 max-w-[24rem] text-sm font-medium leading-6 text-paper/90">
          Menu-bar Mac app + phone remote. Open, close, and switch Mac apps over the same Wi‑Fi.
        </p>
        <button
          type="button"
          className="brutal-press mt-5 min-h-12 w-full border-[4px] border-ink bg-accent-strong px-5 text-sm font-bold uppercase tracking-wide text-ink shadow-[5px_5px_0_#111]"
          onClick={() => onGo("/streamdesk")}
        >
          StreamDesk downloads →
        </button>
      </section>

      <section className="px-5 py-6">
        <h2 className="font-display text-2xl uppercase leading-none">Features</h2>
        <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">
          Everything in the app
        </p>
        <ul className="mt-5 flex flex-col gap-4">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className={`border-4 border-ink px-5 py-4 shadow-[5px_5px_0_#111] ${feature.tone}`}
            >
              <p className="font-mono text-[11px] font-bold tracking-[0.18em]">{feature.n}</p>
              <h3 className="mt-2 font-display text-lg uppercase leading-none">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t-[5px] border-ink bg-ink px-5 py-6 text-paper">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em]">Created by</p>
        <p className="mt-2 font-display text-2xl uppercase">Alfayad</p>
        <p className="mt-2 text-sm leading-6 text-paper/80">Author of this app. Built by Alfayad.</p>
        <a
          href={ALFAYAD_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block border-4 border-paper bg-accent-strong px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-ink"
        >
          alfayad.vercel.app
        </a>
        <button
          type="button"
          className="mt-3 block font-mono text-[11px] font-bold uppercase tracking-[0.16em] underline decoration-2 underline-offset-4"
          onClick={() => onGo("/contact")}
        >
          Contact
        </button>
      </footer>
    </main>
  );
}
