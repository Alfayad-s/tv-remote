import { describe, expect, it } from "vitest";
import { resolveWebSocketUrl } from "./websocketUrl.js";

describe("resolveWebSocketUrl", () => {
  it("uses the page hostname so a phone can reach the LAN service", () => {
    expect(
      resolveWebSocketUrl({ protocol: "http:", hostname: "localhost", port: "" }),
    ).toBe("ws://localhost:8787/ws");
  });

  it("proxies WebSocket through the Vite port on a LAN page", () => {
    expect(
      resolveWebSocketUrl({ protocol: "http:", hostname: "192.168.29.44", port: "5173" }),
    ).toBe("ws://192.168.29.44:5173/ws");
  });

  it("ignores a cloud VITE_WS_URL when the page is already on the LAN", () => {
    expect(
      resolveWebSocketUrl(
        { protocol: "http:", hostname: "192.168.29.44", port: "5173" },
        { VITE_WS_URL: "wss://tv-remote.onrender.com" },
      ),
    ).toBe("ws://192.168.29.44:5173/ws");
  });

  it("prefers an explicit environment override on a public host", () => {
    expect(
      resolveWebSocketUrl(
        { protocol: "https:", hostname: "iffalcon-remote.vercel.app", port: "" },
        { VITE_WS_URL: "wss://home-tunnel.example.com/ws" },
      ),
    ).toBe("wss://home-tunnel.example.com/ws");
  });

  it("uses same-origin WSS on a public HTTPS host so a home tunnel works", () => {
    expect(
      resolveWebSocketUrl({ protocol: "https:", hostname: "remote.example.com", port: "" }),
    ).toBe("wss://remote.example.com/ws");
  });
});
