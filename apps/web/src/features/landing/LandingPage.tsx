import { Download } from "lucide-react";
import { ANDROID_APK_FILENAME, ANDROID_APK_HREF } from "../../utils/androidApk.js";

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
    <div className="flex h-dvh max-h-dvh flex-col overflow-y-auto overscroll-contain">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-[clamp(1.25rem,5vw,1.75rem)] pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
        <p className="text-xs uppercase tracking-[0.28em] text-accent/80">iFFALCON</p>
        <h1 className="mt-3 text-[clamp(2rem,8vw,2.75rem)] font-semibold tracking-tight text-white">
          TV Remote
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-cyan-100/75">
          A personal remote for your iFFALCON Android TV. Download the Android app, or open the web
          remote in this browser.
        </p>

        <a
          href={ANDROID_APK_HREF}
          download={ANDROID_APK_FILENAME}
          className="mt-8 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-strong px-5 text-base font-semibold tracking-wide text-ink shadow-[0_12px_40px_rgb(45_212_191_/_0.28)] transition hover:brightness-110 active:scale-[0.98]"
        >
          <Download className="size-5" strokeWidth={2} aria-hidden="true" />
          Download app
        </a>
        <p className="mt-3 text-center text-sm text-cyan-100/50">
          Android APK. Allow install from this browser if the phone asks.
        </p>

        <button
          type="button"
          className="mt-3 flex min-h-14 w-full items-center justify-center rounded-2xl border border-line bg-white/6 px-5 text-base font-semibold tracking-wide text-cyan-50 transition hover:bg-white/10 active:scale-[0.98]"
          onClick={onOpenRemote}
        >
          Open web remote
        </button>

        <ul className="mt-10 flex flex-col gap-3">
          {FEATURES.map((feature) => (
            <li
              key={feature.title}
              className="rounded-3xl border border-line bg-glass px-5 py-4 backdrop-blur-xl"
            >
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100/70">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-cyan-50/85">{feature.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
