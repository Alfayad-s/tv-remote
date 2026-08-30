import type { ReactNode } from "react";

export function AppShell({
  children,
  scroll = false,
}: {
  children: ReactNode;
  scroll?: boolean;
}) {
  return (
    <div className="flex h-dvh max-h-dvh w-full justify-center px-3 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        className={`relative mt-2 w-full max-w-[430px] border-[5px] border-ink bg-paper shadow-[10px_10px_0_#111] ${
          scroll ? "overflow-y-auto overscroll-contain" : "flex min-h-0 flex-col overflow-hidden"
        }`}
      >
        <span className="absolute -top-3.5 left-4 z-10 bg-ink px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.18em] text-paper">
          REMOTE.APP
        </span>
        {children}
      </div>
    </div>
  );
}
