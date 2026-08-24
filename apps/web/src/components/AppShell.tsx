import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}
