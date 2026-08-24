import { describe, expect, it } from "vitest";
import { isRemoteCommand } from "../commands.js";
import { nextBackoffMs, shouldRetry } from "../backoff.js";
import { validateClientMessage, validateServerMessage } from "../validation.js";

describe("command validation", () => {
  it("accepts known remote commands", () => {
    expect(isRemoteCommand("HOME")).toBe(true);
    expect(isRemoteCommand("VOLUME_UP")).toBe(true);
    expect(isRemoteCommand("BACKSPACE")).toBe(true);
    expect(isRemoteCommand("ENTER")).toBe(true);
  });

  it("rejects unknown commands", () => {
    expect(isRemoteCommand("volume_up")).toBe(false);
    expect(isRemoteCommand("LAUNCH_NETFLIX")).toBe(false);
    expect(isRemoteCommand("")).toBe(false);
  });
});

describe("validateClientMessage", () => {
  it("accepts a typed remote command", () => {
    const result = validateClientMessage({
      id: "1",
      type: "REMOTE_COMMAND",
      payload: { command: "HOME" },
    });

    expect(result).toEqual({
      ok: true,
      value: { id: "1", type: "REMOTE_COMMAND", payload: { command: "HOME" } },
    });
  });

  it("rejects unknown commands", () => {
    const result = validateClientMessage({
      id: "1",
      type: "REMOTE_COMMAND",
      payload: { command: "NOT_A_COMMAND" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("UNKNOWN_COMMAND");
    }
  });

  it("rejects malformed JSON", () => {
    const result = validateClientMessage("{not json");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_MESSAGE");
    }
  });

  it("rejects unknown message types", () => {
    const result = validateClientMessage({
      id: "1",
      type: "HACK_THE_TV",
      payload: {},
    });

    expect(result.ok).toBe(false);
  });

  it("accepts connect with optional host", () => {
    const result = validateClientMessage({
      id: "abc",
      type: "CONNECT_TV",
      payload: { host: "192.168.1.40" },
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an invalid connect host", () => {
    const result = validateClientMessage({
      id: "abc",
      type: "CONNECT_TV",
      payload: { host: "http://tv.local" },
    });

    expect(result.ok).toBe(false);
  });

  it("accepts a hexadecimal pairing PIN", () => {
    const result = validateClientMessage({
      id: "p1",
      type: "SUBMIT_PIN",
      payload: { pin: "ab-cd 12" },
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "p1", type: "SUBMIT_PIN", payload: { pin: "ABCD12" } },
    });
  });

  it("accepts text to send to the TV", () => {
    const result = validateClientMessage({
      id: "t1",
      type: "SEND_TEXT",
      payload: { text: "hello" },
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "t1", type: "SEND_TEXT", payload: { text: "hello" } },
    });
  });

  it("rejects empty text", () => {
    const result = validateClientMessage({
      id: "t1",
      type: "SEND_TEXT",
      payload: { text: "" },
    });
    expect(result.ok).toBe(false);
  });

  it("accepts a supported app launch", () => {
    const result = validateClientMessage({
      id: "a1",
      type: "LAUNCH_APP",
      payload: { app: "youtube" },
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "a1", type: "LAUNCH_APP", payload: { app: "youtube" } },
    });
  });

  it("rejects an unknown app launch", () => {
    const result = validateClientMessage({
      id: "a1",
      type: "LAUNCH_APP",
      payload: { app: "netflix" },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-hex pairing PIN", () => {
    const result = validateClientMessage({
      id: "p1",
      type: "SUBMIT_PIN",
      payload: { pin: "12" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INVALID_PIN");
    }
  });
});

describe("validateServerMessage", () => {
  it("accepts a connection state payload", () => {
    const result = validateServerMessage({
      id: "s1",
      type: "CONNECTION_STATE",
      payload: {
        state: "CONNECTED",
        tv: {
          id: "mock-iffalcon",
          name: "iFFALCON Living Room",
          host: "127.0.0.1",
          connected: true,
        },
      },
    });

    expect(result.ok).toBe(true);
  });

  it("rejects an unknown error code", () => {
    const result = validateServerMessage({
      id: "s1",
      type: "ERROR",
      payload: { code: "ECONNRESET", message: "reset" },
    });

    expect(result.ok).toBe(false);
  });

  it("accepts an IME text-field state", () => {
    const result = validateServerMessage({
      id: "s2",
      type: "IME_STATE",
      payload: { active: true },
    });
    expect(result).toEqual({
      ok: true,
      value: { id: "s2", type: "IME_STATE", payload: { active: true } },
    });
  });
});

describe("reconnect backoff", () => {
  it("follows 1s 2s 4s 8s 16s 30s max", () => {
    expect(nextBackoffMs({ attempt: 0 })).toBe(1_000);
    expect(nextBackoffMs({ attempt: 1 })).toBe(2_000);
    expect(nextBackoffMs({ attempt: 2 })).toBe(4_000);
    expect(nextBackoffMs({ attempt: 3 })).toBe(8_000);
    expect(nextBackoffMs({ attempt: 4 })).toBe(16_000);
    expect(nextBackoffMs({ attempt: 5 })).toBe(30_000);
    expect(nextBackoffMs({ attempt: 8 })).toBe(30_000);
  });

  it("stops after the configured attempt limit", () => {
    expect(shouldRetry(7)).toBe(true);
    expect(shouldRetry(8)).toBe(false);
  });
});
