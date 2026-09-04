import { Download } from "lucide-react";
import { SiteNav } from "./SiteNav.js";

const STREAMDESK_APK = "/downloads/streamdesk.apk";
const STREAMDESK_MAC = "/downloads/StreamDesk-mac.zip";

export function StreamDeskPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <main className="flex flex-col">
      <SiteNav current="streamdesk" onGo={onGo} />

      <section className="border-y-[5px] border-ink bg-blue px-5 pb-7 pt-6 text-paper">
        <p className="inline-block border-4 border-paper bg-ink px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.2em]">
          Mac + phone
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.35rem,12vw,3.15rem)] uppercase leading-[0.88] tracking-tight">
          Stream
          <br />
          Desk
        </h1>
        <p className="mt-4 max-w-[22rem] text-base font-medium leading-7 text-paper/90">
          Open, close, and switch apps on your Mac from your phone — over the same Wi‑Fi.
        </p>
      </section>

      <section className="flex flex-col gap-4 px-5 py-6">
        <h2 className="font-display text-2xl uppercase leading-none">Downloads</h2>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55">
          Two pieces. Mac first, then phone.
        </p>

        <a
          href={STREAMDESK_MAC}
          download="StreamDesk-mac.zip"
          className="brutal-press flex min-h-14 items-center justify-center gap-2 border-[4px] border-ink bg-accent-strong px-5 text-base font-bold uppercase tracking-wide text-ink shadow-[5px_5px_0_#111]"
        >
          <Download className="size-5" strokeWidth={2} aria-hidden="true" />
          Download for Mac
        </a>
        <p className="text-sm leading-6">
          Unzip, double-click <span className="font-mono">Start StreamDesk Desk.command</span>, then
          open <span className="font-mono">http://localhost:8790/</span> to arrange apps. Needs Node.js
          22+.
        </p>

        <a
          href={STREAMDESK_APK}
          download="streamdesk.apk"
          className="brutal-press flex min-h-14 items-center justify-center gap-2 border-[4px] border-ink bg-ink px-5 text-base font-bold uppercase tracking-wide text-paper shadow-[5px_5px_0_#ff5a36]"
        >
          <Download className="size-5" strokeWidth={2} aria-hidden="true" />
          Download Android APK
        </a>
        <p className="text-sm leading-6">
          Install on your phone, allow unknown apps if asked, then connect with the Mac IP and PIN.
          Phone and Mac must share Wi‑Fi.
        </p>
      </section>

      <section className="border-t-[5px] border-ink px-5 py-6">
        <h2 className="font-display text-2xl uppercase leading-none">How it works</h2>
        <ol className="mt-4 flex flex-col gap-3 text-sm leading-6">
          <li className="border-4 border-ink bg-paper px-4 py-3 shadow-[4px_4px_0_#111]">
            <strong>1.</strong> Start StreamDesk Desk on the Mac. Note the 6-digit PIN.
          </li>
          <li className="border-4 border-ink bg-paper px-4 py-3 shadow-[4px_4px_0_#111]">
            <strong>2.</strong> On the Mac, open{" "}
            <span className="font-mono">http://localhost:8790/</span> to add apps with icons and
            drag them into order.
          </li>
          <li className="border-4 border-ink bg-paper px-4 py-3 shadow-[4px_4px_0_#111]">
            <strong>3.</strong> On your phone, enter the Mac IP and PIN — the desk list appears with
            icons.
          </li>
        </ol>
      </section>
    </main>
  );
}
