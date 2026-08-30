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
        className="brutal-press flex min-h-14 w-full items-center justify-center gap-2 border-[4px] border-ink bg-accent-strong px-5 text-base font-bold uppercase tracking-wide text-ink shadow-[5px_5px_0_#111] disabled:opacity-60"
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
        <p className="text-center text-sm font-bold text-coral" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
