import { execFile } from "node:child_process";
import { existsSync, readdirSync, renameSync } from "node:fs";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import { iconsDir } from "./layout.js";

const execFileAsync = promisify(execFile);

function safeIconName(appId: string): string {
  return appId.replace(/[/\\?%*:|"<>]/g, "_");
}

export function iconFilePath(appId: string): string {
  return join(iconsDir(), `${safeIconName(appId)}.png`);
}

export function appBundlePath(appId: string): string | null {
  const candidates = [
    `/Applications/${appId}.app`,
    join(process.env.HOME ?? "", "Applications", `${appId}.app`),
  ];
  for (const path of candidates) {
    if (existsSync(path)) {
      return path;
    }
  }
  return null;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

/** Extract a PNG via qlmanage; never blocks longer than a few seconds. */
export async function ensureAppIcon(appId: string): Promise<string | null> {
  const out = iconFilePath(appId);
  if (existsSync(out)) {
    return out;
  }
  const bundle = appBundlePath(appId);
  if (!bundle) {
    return null;
  }
  const dir = iconsDir();
  try {
    await withTimeout(
      execFileAsync("qlmanage", ["-t", "-s", "128", "-o", dir, bundle], {
        maxBuffer: 2 * 1024 * 1024,
      }),
      4_000,
    );
    const generated = join(dir, `${basename(bundle)}.png`);
    if (existsSync(generated)) {
      renameSync(generated, out);
      return out;
    }
    const match = readdirSync(dir).find(
      (name) => name.startsWith(basename(bundle)) && name.endsWith(".png"),
    );
    if (match) {
      renameSync(join(dir, match), out);
      return out;
    }
  } catch {
    return null;
  }
  return existsSync(out) ? out : null;
}

/** Kick off icon extraction without blocking the HTTP/WebSocket response. */
export function prefetchIcons(appIds: string[]): void {
  void (async () => {
    for (const id of appIds) {
      await ensureAppIcon(id);
    }
  })();
}
