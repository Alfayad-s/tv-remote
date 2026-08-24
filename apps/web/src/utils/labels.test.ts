import { describe, expect, it } from "vitest";
import { nextBackoffMs } from "@tv-remote/shared";
import { validateClientMessage } from "@tv-remote/shared";
import { tvStateLabel } from "./labels.js";

describe("connection labels", () => {
  it("converts technical states into UI copy", () => {
    expect(tvStateLabel("DISCONNECTED")).toBe("Not connected");
    expect(tvStateLabel("RECONNECTING")).toBe("Trying to reconnect…");
    expect(tvStateLabel("ERROR")).toBe("Connection error");
  });
});

describe("client command messages", () => {
  it("builds a valid HOME command payload", () => {
    const result = validateClientMessage({
      id: "ui-1",
      type: "REMOTE_COMMAND",
      payload: { command: "HOME" },
    });
    expect(result.ok).toBe(true);
  });
});

describe("backoff used by the WebSocket client", () => {
  it("caps at 30 seconds", () => {
    expect(nextBackoffMs({ attempt: 6 })).toBe(30_000);
  });
});
