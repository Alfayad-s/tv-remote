import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh max-h-dvh w-full max-w-md flex-col overflow-hidden">
      {children}
    </div>
  );
}
