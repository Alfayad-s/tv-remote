import { EMPTY_SESSION, writeSession } from "./sessionStore.js";

export async function wipeClientData(): Promise<void> {
  writeSession(EMPTY_SESSION);
  try {
    window.localStorage?.clear();
  } catch {
    // Private mode.
  }
  try {
    window.sessionStorage?.clear();
  } catch {
    // Private mode.
  }
  writeSession(EMPTY_SESSION);
  if (typeof caches === "undefined") {
    return;
  }
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch {
    // Cache API can be missing in private WebViews.
  }
}

export function reloadApp(): void {
  window.location.reload();
}
