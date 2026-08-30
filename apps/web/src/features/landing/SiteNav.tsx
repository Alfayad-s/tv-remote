export function SiteNav({
  current,
  onGo,
}: {
  current: "home" | "contact";
  onGo: (path: string) => void;
}) {
  const linkClass = (active: boolean): string =>
    `border-4 border-ink px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] ${
      active ? "bg-accent-strong" : "bg-paper"
    }`;

  return (
    <nav className="flex items-center justify-between gap-3 px-5 py-4" aria-label="Site">
      <button type="button" className={linkClass(current === "home")} onClick={() => onGo("/")}>
        Home
      </button>
      <button
        type="button"
        className={linkClass(current === "contact")}
        onClick={() => onGo("/contact")}
      >
        Contact
      </button>
    </nav>
  );
}
