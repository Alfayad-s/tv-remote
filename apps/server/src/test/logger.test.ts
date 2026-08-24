import { describe, expect, it, vi } from "vitest";
import { createLogger } from "../logger.js";

describe("logger", () => {
  it("redacts pairing secrets and PEM material", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createLogger("debug");

    logger.info("pairing", {
      pin: "ABCD12",
      certPem: "-----BEGIN CERTIFICATE-----",
      keyPem: "-----BEGIN PRIVATE KEY-----",
      pairingCode: "secret-code",
      code: "INVALID_PIN",
      host: "192.168.1.40",
    });

    const line = JSON.parse(String(log.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(line["pin"]).toBe("[redacted]");
    expect(line["certPem"]).toBe("[redacted]");
    expect(line["keyPem"]).toBe("[redacted]");
    expect(line["pairingCode"]).toBe("[redacted]");
    expect(line["code"]).toBe("INVALID_PIN");
    expect(line["host"]).toBe("192.168.1.40");
    log.mockRestore();
  });
});
