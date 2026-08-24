# iFFALCON Remote

Personal Progressive Web App that turns your phone into a remote for an **iFFALCON Android TV** on the same Wi-Fi network.

This repository is a monorepo. The browser PWA never talks to the TV protocol directly. A local Node.js service owns discovery, pairing, and Android TV Remote commands.

```text
React PWA  --WebSocket-->  Node.js service  --Android TV Remote v2-->  iFFALCON TV
```

**Current milestone:** Remote pad, touchpad, and keyboard after a successful pair. Use **Home**, the D-pad, **Touchpad**, volume, and **Keyboard** on the physical iFFALCON.

## Project tree

```text
tv-remote/
├── apps/
│   ├── web/                         # React + Vite PWA
│   └── server/                      # Local Node.js WebSocket service
├── packages/
│   └── shared/                      # Commands, events, messages, validation
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   └── ANDROID_TV_COMPATIBILITY.md
├── scripts/
│   └── generate-icons.mjs
├── data/credentials/                # Pairing certs (gitignored)
├── PROJECT_TASKS.md
├── README.md
├── package.json
└── .env.example
```

## Requirements

- Node.js 22+
- npm 10+
- Phone and computer on the same Wi-Fi network (for later real-TV use)
- The iFFALCON TV on that same network (not required for mock mode)

## Install

```bash
cd tv-remote
npm install
npm run icons
cp .env.example .env
```

## Development

Run the local service and PWA together:

```bash
npm run dev
```

Then open:

- PWA: http://localhost:5173
- WebSocket service: `ws://localhost:8787`

Other commands:

```bash
npm run test
npm run lint
npm run format
npm run typecheck
npm run build
```

Workspace-specific:

```bash
npm run dev:web
npm run dev:server
```

## Environment variables

| Name                   | App    | Default                            | Purpose                                                                    |
| ---------------------- | ------ | ---------------------------------- | -------------------------------------------------------------------------- |
| `HOST`                 | server | `0.0.0.0`                          | Bind address. Use `127.0.0.1` for loopback-only.                           |
| `PORT`                 | server | `8787`                             | WebSocket port                                                             |
| `LOG_LEVEL`            | server | `info` (`debug` in `.env.example`) | `debug` \| `info` \| `warn` \| `error`                                     |
| `TV_ADAPTER`           | server | `mock` (dev) / `androidtv` (production) | `mock` routes loopback to the fake TV and LAN IPs to Android TV pairing. `androidtv` always uses the real protocol. |
| `DISCOVERY_MODE`       | server | `auto` (dev) / `mdns` (production) | `auto` (mDNS + mock device), `mdns`, or `mock`                             |
| `INCLUDE_MOCK`         | server | `true` in development, `false` in production | When false, the 127.0.0.1 demo TV is never listed. Set `true` only to force the mock device. |
| `DISCOVERY_TIMEOUT_MS` | server | `3000`                             | How long an mDNS scan waits, 500–15000                                     |
| `PAIRING_TIMEOUT_MS`   | server | `90000`                            | How long to wait for the on-screen PIN, 10000–180000                       |
| `PAIRING_CLIENT_NAME`  | server | `iFFALCON Remote`                  | Name shown on the TV during pairing                                        |
| `CREDENTIALS_DIR`      | server | `./data/credentials`               | Pairing cert storage. Never commit files here.                             |
| `WS_ALLOWED_ORIGINS`   | server | empty                              | Optional allowlist. Empty allows any origin. Set to your HTTPS URL in production. |
| `WEB_DIST`             | server | auto (`apps/web/dist`)             | Folder of the built PWA. `false` serves only WebSocket + `/health`.            |
| `VITE_WS_URL`          | web    | empty                              | Full WebSocket URL. Empty uses the page hostname (`/ws`). Do not set this on the home computer. |
| `VITE_WS_PORT`         | web    | `8787`                             | Used when `VITE_WS_URL` is empty and the page has no port.                     |

Do not put pairing PINs, certificates, or private keys in frontend env vars.

## Test the PWA locally

1. `npm run dev`
2. Open http://localhost:5173 on the computer.
3. You should see **iFFALCON Remote** and **TV: Not connected**.
4. Confirm **Local service online**.
5. Confirm **Available TVs** shows the mock iFFALCON (`127.0.0.1`). A physical TV on the same Wi-Fi may also appear after ~3 seconds.
6. Select the mock device and tap **Connect TV**.
7. Use **Home**, the D-pad, volume, and the **Touchpad** tab. The UI should show `Last command: …`.
8. If discovery is empty, type the TV IP under **Manual IP**. A LAN address starts Android TV pairing: enter the PIN shown on the TV, then use the remote pad.
9. Chrome/Edge: DevTools → Application → Manifest / Service Workers to confirm PWA registration.
10. Optional: Install the app from the browser install prompt.

The UI still loads if the TV (or mock session) is disconnected. If the Node service is down, the PWA shows **Local service unavailable** instead of crashing.

## Test WebSocket connectivity

From the computer:

```bash
npm run dev:server
```

In another terminal:

```bash
npx wscat -c ws://localhost:8787/ws
```

Send:

```json
{ "id": "0", "type": "DISCOVER_TVS", "payload": {} }
```

You should receive `TV_LIST` with at least the mock device (when `DISCOVERY_MODE=auto`).

Then:

```json
{ "id": "1", "type": "CONNECT_TV", "payload": { "id": "mock-iffalcon", "host": "127.0.0.1" } }
```

You should receive `CONNECTION_STATE` then `TV_EVENT` with `"event":"CONNECTED"`.

A LAN host starts pairing instead of the mock adapter. When the TV shows a PIN:

```json
{ "id": "1b", "type": "SUBMIT_PIN", "payload": { "pin": "<code-from-tv>" } }
```

Certificates stay on the Node service. Never commit files under `CREDENTIALS_DIR`.

Then:

```json
{ "id": "2", "type": "REMOTE_COMMAND", "payload": { "command": "HOME" } }
```

You should receive `COMMAND_ACK` for `HOME`.

Unknown commands are rejected:

```json
{ "id": "3", "type": "REMOTE_COMMAND", "payload": { "command": "EXPLODE" } }
```

Expected: `ERROR` with `UNKNOWN_COMMAND`.

From a phone on the same Wi-Fi, open `http://<computer-lan-ip>:5173`. The PWA uses that same host for the WebSocket (Vite proxies `/ws` to port `8787`).

## Installed phone app

The Vercel/internet home-screen icon is a **different app** from `http://192.168.29.44:5173`. It talks to the cloud Node service, so it cannot list TVs on your Wi-Fi even when the LAN page works.

1. Keep `npm run dev` running on the computer.
2. On the phone, open `http://<computer-lan-ip>:5173` in the browser (not the internet icon).
3. Confirm **Available TVs** lists devices.
4. Browser menu → **Add to Home Screen** / **Install app**.
5. Delete the old internet icon so you do not open it by mistake.

An HTTPS install cannot use `ws://192.168.x.x` (the browser blocks mixed content). Always install from the LAN `http://…:5173` page **or** from a home HTTPS tunnel (below).

## Deploy so the phone app works

Vercel/Render **cannot** talk to `192.168.x.x`. The Node process that pairs with the TV must stay on a computer (or Raspberry Pi) on the same Wi-Fi. You can still install a normal HTTPS app on the phone by putting a tunnel in front of that home process.

```text
Phone PWA (https://…)  --WSS-->  Cloudflare Tunnel  -->  Node on home Wi-Fi  -->  iFFALCON
```

1. On the home computer, leave `VITE_WS_URL` empty in `.env`, then:

```bash
npm run build
NODE_ENV=production npm run start
```

2. In another terminal, expose port `8787` with [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/):

```bash
npx cloudflared tunnel --url http://localhost:8787
```

3. Open the `https://….trycloudflare.com` URL on the phone. Confirm TVs appear, then **Add to Home Screen**.

Quick tunnels change URL every restart — do not treat that as a permanent install. For a stable app, create a named tunnel and a hostname such as `remote.yourdomain.com`, then always open that URL.

The computer must stay on and `npm run start` must keep running. Putting only the PWA on Vercel, or only Node on Render, will not control the TV.

## Native Android app

The phone can talk to the TV directly. The laptop can be off. This uses Capacitor plus a Kotlin plugin for Android TV Remote v2 (TLS 6466/6467).

1. Install Android Studio and a phone USB cable (or an emulator on the same Wi-Fi as the TV — a real phone is better).
2. From this repo:

```bash
npm install
npm run icons
npm run android:sync
npm run android
```

3. In Android Studio, wait for Gradle, then Run on your phone.
4. Phone and iFFALCON must be on the same Wi-Fi. Enter `192.168.29.14` (or Scan), pair with the PIN on the TV, then use the pad.

Status should read **Phone ready — laptop not required**. Pairing certificates stay on the phone.

## Laptop off

This laptop **cannot** run the PWA Node service while it is powered off. Use the **native Android app** above, or a Raspberry Pi for the web PWA.

On that Pi, from this repo:

```bash
docker compose up -d --build
```

Then on the phone (same Wi-Fi), open `http://<pi-ip>:8787`, confirm TVs appear, and **Add to Home Screen**. You can shut this laptop down after that.

Without Docker, on the Pi:

```bash
npm install
npm run icons
npm run build
NODE_ENV=production npm run start
```

Use `tmux`, `systemd`, or Docker `restart: unless-stopped` so it comes back after a power cut.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Next task

Confirm D-pad, touchpad swipes, and keyboard text on the physical iFFALCON. App shortcuts come after that.
