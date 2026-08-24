export function resolveWebSocketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL;
  if (configured && configured.length > 0) {
    return configured;
  }

  const port = import.meta.env.VITE_WS_PORT ?? "8787";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.hostname}:${port}`;
}

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
