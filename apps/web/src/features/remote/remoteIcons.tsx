import type { ReactNode } from "react";

export function IconPower(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M12 3v8M7.5 6.2a8 8 0 1 0 9 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconClock(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.2l3.2 1.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconMute(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M4 10v4h3l5 4V6L7 10H4zM17 9l5 6M22 9l-5 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevron({ rotate = 0 }: { rotate?: number }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-7"
      fill="none"
      aria-hidden="true"
      style={{ transform: `rotate(${String(rotate)}deg)` }}
    >
      <path
        d="M7 14l5-5 5 5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBack(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M10 6l-6 6 6 6M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconHome(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconPlayPause(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden="true">
      <path d="M5 5h4v14H5zM13 5l8 7-8 7V5z" fill="currentColor" />
    </svg>
  );
}

export function IconSkip({ forward = false }: { forward?: boolean }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
      aria-hidden="true"
      style={{ transform: forward ? undefined : "scaleX(-1)" }}
    >
      <path d="M4 6l9 6-9 6V6zm10 0h3v12h-3z" />
    </svg>
  );
}

export function IconSeek({ forward = false }: { forward?: boolean }): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-6"
      fill="currentColor"
      aria-hidden="true"
      style={{ transform: forward ? undefined : "scaleX(-1)" }}
    >
      <path d="M4 6l8 6-8 6V6zm8 0l8 6-8 6V6z" />
    </svg>
  );
}
