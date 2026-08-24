import { useState } from "react";
import { Download } from "lucide-react";
import { downloadAndroidApk } from "../../utils/downloadAndroidApk.js";

export function DownloadAppButton({ className = "" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={`flex w-full flex-col gap-2 ${className}`}>
      <button
        type="button"
        disabled={busy}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent-strong px-5 text-base font-semibold tracking-wide text-ink shadow-[0_12px_40px_rgb(45_212_191_/_0.28)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        onClick={() => {
          setBusy(true);
          setError(null);
          void downloadAndroidApk().then((message) => {
            setError(message);
            setBusy(false);
          });
        }}
      >
        <Download className="size-5" strokeWidth={2} aria-hidden="true" />
        {busy ? "Downloading…" : "Download app"}
      </button>
      {error ? (
        <p className="text-center text-sm text-rose-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
