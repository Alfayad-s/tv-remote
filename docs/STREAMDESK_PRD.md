# StreamDesk — Product Requirements Document

| Field | Value |
| --- | --- |
| Status | In progress (M1–M3 scaffold) |
| Version | 0.1 |
| Last updated | 2026-09-04 |
| Related product | iFFALCON TV Remote (this monorepo’s existing app) |

---

## 1. Overview

### 1.1 Problem

When working at a Mac, switching, launching, or quitting apps usually means walking back to the keyboard or fumbling with trackpad gestures. People already hold a phone; they need a simple remote for the **desk**, not another full remote-desktop session.

### 1.2 Product

**StreamDesk** is a two-piece system:

1. **Mobile app (Android first)** — remote UI to open, close, and switch apps on a paired Mac.
2. **Desktop companion (macOS)** — always-available agent on the Mac that receives commands and talks to the OS.

The existing **website** (same deployment as the TV remote) markets StreamDesk and hosts **download links** for both the Android APK and the macOS build.

### 1.3 One-liner

> Control which apps are open on your Mac from your phone — over the same Wi‑Fi.

### 1.4 How it relates to iFFALCON Remote

| | TV Remote | StreamDesk |
| --- | --- | --- |
| Target | Android TV | Mac apps |
| Companion | Optional Node server / native TV plugin | Required macOS desk app |
| Download | `iffalcon-remote.apk` | `streamdesk.apk` + macOS archive |
| Session | Independent | Independent — no shared credentials or UI |

StreamDesk must **not** merge into the TV remote UI, speaker remote, or TV pairing flow.

---

## 2. Goals and non-goals

### 2.1 Goals (v1)

- Pair phone ↔ Mac over the local network with a short PIN / code shown on the Mac.
- From the phone: **list**, **open (launch)**, **close (quit)**, and **switch (activate / bring to front)** apps.
- Favorites for one-tap launch / switch.
- Persist last Mac host so reconnect is one tap.
- Ship **Android APK** and **macOS companion** downloads from the same website.
- Clear setup: Wi‑Fi, Mac permissions, and “desk app must be running.”

### 2.2 Non-goals (v1)

- Full remote desktop, screen mirror, or video stream of the Mac.
- Mouse / keyboard / trackpad injection.
- Controlling UI inside an app (menus, tabs, click coordinates).
- Force-quit as the default close action (optional later).
- iOS App Store release (PWA optional later; not required for v1).
- Windows / Linux desk agents.
- Cloud relay or control from outside the LAN.
- Streaming platforms (Twitch/OBS) — name is StreamDesk; v1 is **desk app control**, not live-stream tooling.

---

## 3. Personas and use cases

### 3.1 Personas

- **Solo worker / creator** — Mac at desk, phone in hand; switches between browser, editor, and music without touching the Mac.
- **Couch / away-from-desk** — starts or focuses a known app before sitting down.
- **Same-site visitor** — already uses the TV remote site; discovers StreamDesk and installs both pieces.

### 3.2 Primary use cases

1. Open Chrome on the Mac from the phone.
2. Switch from Cursor to Spotify without Alt-Tab on the Mac.
3. Quit Slack when done for the day.
4. Reopen yesterday’s favorite set (browser + notes + music) from a favorites row.
5. Download Mac app + Android APK from the website and complete first pairing in under five minutes.

---

## 4. Product surfaces

| Surface | Role |
| --- | --- |
| **StreamDesk Android** | Primary remote UI |
| **StreamDesk for Mac** | Desk agent: pairing, WebSocket server, app control |
| **Marketing website** | Explain product; download Android + Mac builds |
| **(Optional later)** PWA | Same remote UI in browser when on LAN — not required for v1 |

---

## 5. Functional requirements

### 5.1 Pairing and connection

| ID | Requirement | Priority |
| --- | --- | --- |
| C1 | Mac desk app shows a pairing PIN (or QR + PIN) while waiting for a phone | Must |
| C2 | Phone can discover the Mac on LAN (Bonjour/mDNS) and/or enter IP manually | Must |
| C3 | Phone submits PIN; Mac accepts and stores a paired device token | Must |
| C4 | Subsequent connects reuse the token without re-entering PIN until revoked | Must |
| C5 | Phone and Mac show clear connected / disconnected / reconnecting states | Must |
| C6 | Only devices on the same LAN can connect (no intentional WAN/cloud relay in v1) | Must |
| C7 | User can revoke all phones from the Mac app | Should |

### 5.2 App list

| ID | Requirement | Priority |
| --- | --- | --- |
| L1 | Phone shows **running** apps (name + icon when available) | Must |
| L2 | Phone can browse or search **installed / launchable** apps (or a curated subset) | Must |
| L3 | User can mark apps as **favorites** (stored on phone and/or Mac) | Must |
| L4 | List refreshes when apps launch or quit on the Mac | Should |
| L5 | Hide obvious system noise (login items helper processes) where practical | Should |

### 5.3 Open / close / switch

| ID | Requirement | Priority |
| --- | --- | --- |
| A1 | **Open** — launch app by bundle identifier (or stable app id from desk agent) | Must |
| A2 | **Switch** — activate a running app (bring to front) | Must |
| A3 | **Close** — graceful quit (equivalent to normal Quit) | Must |
| A4 | If Open is tapped on an already-running app, behave as Switch | Should |
| A5 | Confirm before Close for selected apps (optional setting) | Could |
| A6 | Force Quit | Won’t (v1) |

### 5.4 Mobile UX

| ID | Requirement | Priority |
| --- | --- | --- |
| M1 | Home: connection status + favorites + running apps | Must |
| M2 | App detail or row actions: Open / Switch / Close | Must |
| M3 | Settings: saved Mac, forget device, haptic toggle | Should |
| M4 | Errors explain Wi‑Fi, desk app not running, permission denied | Must |
| M5 | Visual language can differ from TV remote but stay simple and thumb-friendly | Should |

### 5.5 macOS desk app

| ID | Requirement | Priority |
| --- | --- | --- |
| D1 | Runs as a menu-bar / accessory app; survives user logout only if standard Mac patterns allow (v1: stay running while user is logged in) | Must |
| D2 | Starts local WebSocket (or equivalent) server on a fixed or advertised port | Must |
| D3 | Advertises via Bonjour for discovery | Should |
| D4 | Implements list / launch / activate / quit via `NSWorkspace` (preferred) | Must |
| D5 | Requests and documents required macOS privacy permissions | Must |
| D6 | Shows pairing UI, connection status, and “open at login” option | Should |
| D7 | Auto-update mechanism | Could |

### 5.6 Website and downloads

| ID | Requirement | Priority |
| --- | --- | --- |
| W1 | Marketing page or section for StreamDesk on the existing site | Must |
| W2 | Download Android APK at a stable public path (e.g. `/downloads/streamdesk.apk`) | Must |
| W3 | Download macOS build (e.g. `/downloads/StreamDesk.dmg` or `.zip`) | Must |
| W4 | Copy distinguishes StreamDesk from iFFALCON TV Remote downloads | Must |
| W5 | Build/publish scripts copy both artifacts into `apps/web/public/downloads/` (same pattern as current APK publish) | Must |

---

## 6. Non-functional requirements

| ID | Requirement |
| --- | --- |
| N1 | Android `applicationId` distinct from TV remote (e.g. `com.streamdesk.app`) |
| N2 | Separate version codes / version names for StreamDesk Android and Mac |
| N3 | Command latency on a healthy LAN should feel instant (&lt; ~200 ms typical for switch/open ack) |
| N4 | Desk agent must fail closed: reject unauthenticated commands |
| N5 | No TV remote, speaker Bluetooth, or Android TV code paths inside StreamDesk |
| N6 | Logging on Mac must not upload data off-device in v1 |

---

## 7. Architecture

### 7.1 High-level

```text
┌─────────────────────┐         Wi‑Fi / LAN          ┌──────────────────────────┐
│  StreamDesk Mobile  │ ──── WebSocket + pairing ───▶ │  StreamDesk for Mac       │
│  (Android)          │ ◀─── app list / acks ──────── │  (desk agent)             │
└─────────────────────┘                              │         │                 │
                                                     │         ▼                 │
                                                     │  NSWorkspace / AppKit     │
                                                     │  launch · activate · quit │
                                                     └──────────────────────────┘
```

### 7.2 Protocol sketch (v1)

Shared JSON messages (exact schema to be defined in `packages/` when implemented):

| Direction | Type | Purpose |
| --- | --- | --- |
| Phone → Mac | `PAIR` | Submit PIN |
| Phone → Mac | `AUTH` | Present device token |
| Phone → Mac | `LIST_APPS` | Request running and/or installed |
| Phone → Mac | `LAUNCH` | Open app `{ bundleId }` |
| Phone → Mac | `ACTIVATE` | Switch to app `{ bundleId }` |
| Phone → Mac | `QUIT` | Close app `{ bundleId }` |
| Mac → Phone | `PAIR_RESULT` / `AUTH_RESULT` | Accept / reject |
| Mac → Phone | `APP_LIST` | Running + optional catalog |
| Mac → Phone | `COMMAND_ACK` | Success / failure + reason |
| Mac → Phone | `APP_EVENT` | App launched / quit (push) |

### 7.3 Monorepo placement (recommended)

Keep StreamDesk in this monorepo next to the TV remote so the **website and download pipeline** stay shared:

```text
tv-remote/
├── apps/
│   ├── web/                 # Marketing site + both product downloads
│   ├── server/              # Existing TV gateway (unchanged)
│   └── streamdesk/          # NEW: mobile UI (Capacitor) + shared client
├── apps/streamdesk-mac/     # NEW: macOS desk agent (Swift preferred)
├── packages/
│   ├── shared/              # Existing TV shared types
│   └── streamdesk-protocol/ # NEW: StreamDesk messages / validation
└── docs/
    └── STREAMDESK_PRD.md    # This document
```

**Simpler alternate for first spike:** implement Mac agent + Android under `apps/streamdesk/` with a `mac/` subfolder; still keep downloads under `apps/web/public/downloads/`.

### 7.4 macOS permissions (document in UI)

Depending on implementation, the Mac may require:

- **Automation** — if AppleScript is used for quit/activate fallbacks.
- **Accessibility** — only if deeper window control is added later (avoid for v1 if `NSWorkspace` alone is enough).
- **Local network** — if the OS prompts for listening / discovery.

Setup screen on first launch must link to System Settings for any denied permission.

---

## 8. Screens

### 8.1 Android

1. **Connect** — discovered Macs, manual IP, PIN entry.
2. **Desk** — favorites row, running apps, pull-to-refresh.
3. **Library / search** — find apps to open or favorite.
4. **Settings** — saved Mac, revoke, about.

### 8.2 macOS

1. **Menu bar status** — connected phones count, start/stop agent.
2. **Pairing window** — PIN, QR optional.
3. **Preferences** — open at login, port, revoke devices, permissions checklist.

### 8.3 Website

1. StreamDesk section or `/streamdesk` page: value prop, two download buttons (Mac + Android), short setup steps.
2. Do not bury StreamDesk inside the TV remote connect flow.

---

## 9. Success metrics

- First-time user pairs phone to Mac in ≤ 5 minutes with written steps.
- Open / switch / close succeed ≥ 99% when desk app is running and permissions granted.
- Zero cross-talk: installing StreamDesk never breaks TV remote pairing.
- Website visitors can download the correct artifact without confusing it for `iffalcon-remote.apk`.

---

## 10. Milestones

| Phase | Deliverable | Exit criteria |
| --- | --- | --- |
| **M0** | PRD approved | This doc signed off |
| **M1** | Scaffold | Empty Android shell + empty Mac menu-bar app; protocol package stub; website stubs for downloads |
| **M2** | Pairing | PIN pair over LAN; reconnect with token |
| **M3** | Core control | List running; launch; activate; quit; favorites |
| **M4** | Ship downloads | Signed/notarized Mac build (or documented ad-hoc for personal use); Android APK on site; landing copy live |
| **M5** | Polish | Discovery, better icons, permission UX, revoke devices |

---

## 11. Decisions locked for this draft

| Topic | Decision |
| --- | --- |
| Mobile platform (v1) | **Android** (Capacitor), same download pattern as TV remote |
| Desktop platform (v1) | **macOS only** |
| Close behavior | **Graceful quit**; no force-quit in v1 |
| App lists | **Running + favorites + searchable launchable apps** |
| Repo | **Same monorepo**; separate apps and downloads |
| Product name | **StreamDesk** (desk control; not OBS/stream tooling in v1) |
| Network | **LAN only** |

---

## 12. Open questions

- [ ] Prefer **Swift/AppKit** Mac agent vs Electron/Tauri for faster UI iteration?
- [ ] Personal / debug signing only for Mac downloads, or Apple Developer notarization from day one?
- [ ] Should favorites sync to the Mac agent (multi-phone) or stay phone-local in v1?
- [ ] Rename umbrella site later (e.g. “desk tools”) vs keep TV-remote branding with a StreamDesk section?
- [ ] iOS / PWA as M6 or never?

---

## 13. Out of scope reminders

Do not implement in StreamDesk v1: TV protocols, Bluetooth speaker DSP, OBS, screen sharing, or cloud accounts.

---

## 14. Approval

| Role | Name | Date | Sign-off |
| --- | --- | --- | --- |
| Product owner | | | |
| Engineering | | | |
