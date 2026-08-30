import type { ReactNode } from "react";

export function AppShell({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <div className="flex h-dvh max-h-dvh w-full justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className={`flex w-full max-w-[430px] flex-col border-[5px] border-ink bg-paper shadow-[8px_8px_0_#111] ${
          scroll ? "min-h-0 overflow-hidden" : "min-h-0 overflow-hidden"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between border-b-[5px] border-ink bg-ink px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-paper">
            REMOTE.APP
          </span>
          <span className="size-2.5 shrink-0 bg-accent-strong" aria-hidden="true" />
        </header>
        <div
          className={
            scroll
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain"
              : "flex min-h-0 flex-1 flex-col overflow-hidden"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
