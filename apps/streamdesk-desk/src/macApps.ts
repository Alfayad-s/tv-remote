import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { DeskApp } from "@tv-remote/streamdesk-protocol";
import { prefetchIcons } from "./icons.js";
import { readLayout } from "./layout.js";

const execFileAsync = promisify(execFile);

const HIDDEN_NAMES = new Set([
  "Finder",
  "SystemUIServer",
  "Dock",
  "Control Center",
  "Notification Center",
  "WindowServer",
  "loginwindow",
]);

function escapeAppleScript(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

async function runOsascript(source: string): Promise<string> {
  const { stdout } = await execFileAsync("osascript", ["-e", source], {
    maxBuffer: 2 * 1024 * 1024,
  });
  return stdout.trim();
}

function iconUrlFor(appId: string, publicBase: string): string | null {
  // Always advertise the URL — /icons/:id.png extracts on first request.
  return `${publicBase}/icons/${encodeURIComponent(appId)}.png`;
}

export async function listRunningApps(publicBase: string): Promise<DeskApp[]> {
  try {
    const raw = await withTimeout(
      runOsascript(
        'tell application "System Events" to get name of every process whose background only is false',
      ),
      2_500,
      "",
    );
    if (!raw) {
      return [];
    }
    const names = raw.split(", ").map((name) => name.trim()).filter(Boolean);
    const unique = [...new Set(names)].filter((name) => !HIDDEN_NAMES.has(name));
    return unique.map((name) => ({
      id: name,
      name,
      bundleId: null,
      running: true,
      iconUrl: iconUrlFor(name, publicBase),
      order: null,
    }));
  } catch {
    return [];
  }
}

export async function listInstalledApps(publicBase: string): Promise<DeskApp[]> {
  const dirs = [
    "/Applications",
    "/System/Applications",
    "/System/Applications/Utilities",
    "/Applications/Utilities",
    join(process.env.HOME ?? "", "Applications"),
  ];
  const seen = new Set<string>();
  const apps: DeskApp[] = [];
  for (const dir of dirs) {
    if (!dir) {
      continue;
    }
    try {
      const entries = await readdir(dir);
      for (const entry of entries) {
        if (!entry.endsWith(".app")) {
          continue;
        }
        const name = entry.replace(/\.app$/u, "");
        if (seen.has(name)) {
          continue;
        }
        seen.add(name);
        apps.push({
          id: name,
          name,
          bundleId: null,
          running: false,
          iconUrl: iconUrlFor(name, publicBase),
          order: null,
        });
      }
    } catch {
      // Directory may not exist.
    }
  }
  apps.sort((a, b) => a.name.localeCompare(b.name));
  return apps;
}

export async function listApps(publicBase: string): Promise<{
  desk: DeskApp[];
  apps: DeskApp[];
  running: DeskApp[];
}> {
  const [running, installed] = await Promise.all([
    listRunningApps(publicBase),
    listInstalledApps(publicBase),
  ]);
  const runningIds = new Set(running.map((app) => app.id));
  const apps = installed.map((app) =>
    runningIds.has(app.id) ? { ...app, running: true } : app,
  );
  for (const app of running) {
    if (!apps.some((item) => item.id === app.id)) {
      apps.unshift(app);
    }
  }

  const layout = readLayout();
  // Never block listing on icon extraction — warm the cache in the background.
  prefetchIcons(layout.appIds);

  const byId = new Map(apps.map((app) => [app.id, app]));
  const desk: DeskApp[] = [];
  layout.appIds.forEach((id, index) => {
    const found = byId.get(id);
    if (found) {
      desk.push({
        ...found,
        iconUrl: iconUrlFor(id, publicBase),
        order: index,
      });
      return;
    }
    desk.push({
      id,
      name: id,
      bundleId: null,
      running: false,
      iconUrl: iconUrlFor(id, publicBase),
      order: index,
    });
  });

  return {
    desk,
    apps: apps.map((app) => ({
      ...app,
      iconUrl: iconUrlFor(app.id, publicBase),
      order: layout.appIds.includes(app.id) ? layout.appIds.indexOf(app.id) : null,
    })),
    running: running.map((app) => ({
      ...app,
      iconUrl: iconUrlFor(app.id, publicBase),
      order: layout.appIds.includes(app.id) ? layout.appIds.indexOf(app.id) : null,
    })),
  };
}

export async function launchApp(appId: string): Promise<void> {
  await execFileAsync("open", ["-a", appId]);
}

export async function activateApp(appId: string): Promise<void> {
  await runOsascript(`tell application "${escapeAppleScript(appId)}" to activate`);
}

export async function quitApp(appId: string): Promise<void> {
  await runOsascript(`tell application "${escapeAppleScript(appId)}" to quit`);
}
