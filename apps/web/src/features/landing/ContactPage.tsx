import { SiteNav } from "./SiteNav.js";

const ALFAYAD_URL = "https://alfayad.vercel.app";

export function ContactPage({ onGo }: { onGo: (path: string) => void }) {
  return (
    <main className="flex flex-col">
      <SiteNav current="contact" onGo={onGo} />

      <section className="border-y-[5px] border-ink bg-coral px-5 py-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em]">Contact</p>
        <h1 className="mt-3 font-display text-[clamp(2.1rem,11vw,2.85rem)] uppercase leading-[0.9]">
          Author
        </h1>
        <p className="mt-4 text-base font-medium leading-7">
          This Android TV remote was created and built by Alfayad.
        </p>
      </section>

      <section className="flex flex-col gap-4 px-5 py-6">
        <article className="border-4 border-ink bg-paper p-5 shadow-[5px_5px_0_#111]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Author</p>
          <h2 className="mt-2 font-display text-2xl uppercase">Alfayad</h2>
          <p className="mt-3 text-sm leading-6">
            Author of this app. Built by Alfayad.
          </p>
        </article>

        <article className="border-4 border-ink bg-accent-strong p-5 shadow-[5px_5px_0_#111]">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Website</p>
          <a
            href={ALFAYAD_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block font-display text-xl uppercase underline decoration-4 underline-offset-4"
          >
            alfayad.vercel.app
          </a>
          <p className="mt-3 text-sm leading-6">Open Alfayad’s site for more work and contact.</p>
        </article>
      </section>
    </main>
  );
}
