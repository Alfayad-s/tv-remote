# StreamDesk — local development

## Pieces

| Package | Role |
| --- | --- |
| `packages/streamdesk-protocol` | Shared WebSocket message types |
| `apps/streamdesk-desk` | macOS Electron menu-bar desk app (open / close / switch) |
| `apps/streamdesk` | Phone remote UI (Vite + Capacitor Android APK) |
| Website `/streamdesk` | Marketing + download links |

## Run

```bash
npm install
npm run streamdesk:dev
```

- Desk app: **SD** appears in the macOS menu bar with a **6-digit PIN** (port **8790**)
- Phone UI: http://localhost:5174 (use your Mac’s LAN IP from the phone)

Or separately:

```bash
npm run streamdesk:desk
npm run streamdesk:mobile
```

CLI-only desk agent (no Electron tray): `npm run streamdesk:desk:cli`

## First pair

1. Start StreamDesk on the Mac (menu bar **SD**).
2. Click **Arrange Apps…** — add apps (with icons) and drag to reorder.
3. On the phone UI, enter the Mac IP + PIN and connect.
4. The phone shows that same desk list; tap to open/switch, Close to quit.

Icons are cached in `~/.streamdesk/icons/`. Layout is stored in `~/.streamdesk/layout.json`.

## Permissions

macOS may ask for Automation when quitting or activating apps via AppleScript. Allow StreamDesk when prompted.

Unsigned builds: right-click **StreamDesk.app** → Open → Open the first time.

## Downloads on the website

After packaging:

```bash
npm run streamdesk:package
# or Mac only:
npm run streamdesk:package:mac
```

- `/downloads/streamdesk.apk` — Android app
- GitHub Releases `StreamDesk.dmg` — Mac menu-bar Electron app (unsigned; drag to Applications)
- GitHub Releases `StreamDesk-mac.zip` — same `.app` as a zip fallback

Website “Download for Mac” points at:

`https://github.com/Alfayad-s/tv-remote/releases/latest/download/StreamDesk.dmg`

Publish a Mac build:

```bash
npm run streamdesk:package:mac
# then tag + push, or run the “StreamDesk Mac release” GitHub Action
git tag streamdesk-v0.1.0 && git push origin streamdesk-v0.1.0
```
