# Architecture

## Why a local Node.js service exists

Browsers cannot open arbitrary TCP/TLS sockets. Android TV Remote v2 requires:

- TLS with a client certificate
- Pairing on TCP **6467**
- Command sessions on TCP **6466**

Those sockets belong in Node.js. The React PWA only speaks WebSocket to the local service.

```text
Phone PWA
    │  typed JSON over WebSocket
    ▼
Node.js service  (apps/server)
    │  TVAdapter interface
    ▼
MockTVAdapter (loopback)  or  AndroidTVAdapter (LAN IP, Phase 5+)
    │  Android TV Remote v2
    ▼
iFFALCON Android TV
```

## Packages

| Package           | Responsibility                                                            |
| ----------------- | ------------------------------------------------------------------------- |
| `packages/shared` | Commands, connection states, error codes, WebSocket envelopes, validation |
| `apps/web`        | PWA UI, WebSocket client, haptics, offline shell                          |
| `apps/server`     | WebSocket gateway, TV manager, adapters, discovery, credential storage    |

The frontend must not import anything from `apps/server/src/tv/androidtv`.

## Message protocol

Every frame is JSON:

```ts
{
  id: string;
  type: string;
  payload: object;
}
```

Client → server:

- `CONNECT_TV`
- `DISCONNECT_TV`
- `DISCOVER_TVS`
- `REMOTE_COMMAND`
- `SUBMIT_PIN`
- `PING`

Server → client:

- `CONNECTION_STATE`
- `TV_EVENT`
- `TV_LIST`
- `ERROR`
- `PONG`
- `COMMAND_ACK`

Unknown types and unknown `RemoteCommand` values are rejected. Malformed packets return `INVALID_MESSAGE` instead of taking down the socket.

## Connection states

```text
DISCONNECTED → CONNECTING → PAIRING → CONNECTED
                     ↘ ERROR
CONNECTED → DISCONNECTED
WebSocket drop → client reconnects with exponential backoff
```

Backoff: 1s, 2s, 4s, 8s, 16s, then 30s cap. The client stops after 8 attempts so it does not retry forever.

Heartbeat: application `PING`/`PONG` every 15s, plus WebSocket protocol ping from the server.

## Discovery

The Node service browses mDNS for Android TV Remote Service:

- `_androidtvremote2._tcp` (v2, current Google TV / Android TV Remote Service)
- `_androidtvremote._tcp` (legacy)

The PWA never speaks mDNS. It sends `DISCOVER_TVS` and renders `TV_LIST`.

If multicast is blocked, the user can type the TV IPv4 address. That address is paired over Android TV Remote v2 (TCP 6467) the first time this computer connects.

`DISCOVERY_MODE=auto` also includes the mock iFFALCON so the UI can be used without a TV on the LAN.

```ts
interface TVAdapter {
  connect(): Promise<TVDevice>;
  disconnect(): Promise<void>;
  sendCommand(command: RemoteCommand): Promise<void>;
  getDevice(): TVDevice | null;
  isConnected(): boolean;
  submitPin?(pin: string): Promise<void>;
}
```

Current implementations:

- `MockTVAdapter` — in-process fake iFFALCON used for UI and WebSocket development
- `AndroidTVAdapter` — Android TV Remote v2 via `@kud/androidtv-remote` (pairing 6467, keys 6466)
- `SwitchingTVAdapter` — default `TV_ADAPTER=mock` routes loopback to mock and LAN IPs to Android TV

Future adapters (`SamsungTVAdapter`, `LGTVAdapter`) should implement the same interface. Brand-specific protocol code stays under `apps/server/src/tv/`.

## Credential handling

Pairing certificates are generated and stored only by the Node service (`CREDENTIALS_DIR`). The PWA may send a PIN the user typed; it must never receive or persist the TLS private key.

## Security posture

This is a LAN application.

- Bind to the local network, never port-forward the WebSocket port
- Optional `WS_ALLOWED_ORIGINS`
- Validate every inbound message
- Redact `pin`, `cert`, `key`, `certPem`, `keyPem`, and similar fields in logs
- Keep secrets out of git (`.env`, `data/credentials/`)

## Offline PWA

The service worker caches the application shell. Offline means the UI still renders and can show **TV unavailable** / **Local service unavailable**. It does not mean the TV can be controlled without Wi-Fi.
