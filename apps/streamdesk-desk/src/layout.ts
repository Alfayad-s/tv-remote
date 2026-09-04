import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface DeskLayout {
  /** Ordered app ids shown on the phone. */
  appIds: string[];
}

function layoutPath(): string {
  return join(homedir(), ".streamdesk", "layout.json");
}

export function streamdeskDir(): string {
  const dir = join(homedir(), ".streamdesk");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function iconsDir(): string {
  const dir = join(streamdeskDir(), "icons");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function readLayout(): DeskLayout {
  const path = layoutPath();
  if (!existsSync(path)) {
    return { appIds: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as DeskLayout;
    return {
      appIds: Array.isArray(raw.appIds)
        ? raw.appIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch {
    return { appIds: [] };
  }
}

export function writeLayout(layout: DeskLayout): void {
  streamdeskDir();
  writeFileSync(layoutPath(), JSON.stringify({ appIds: layout.appIds }, null, 2), "utf8");
}
