# StreamDesk — local development

## Pieces

| Package | Role |
| --- | --- |
| `packages/streamdesk-protocol` | Shared WebSocket message types |
| `apps/streamdesk-desk` | macOS desk agent (open / close / switch apps) |
| `apps/streamdesk` | Phone remote UI (Vite; Capacitor Android APK later) |
| Website `/streamdesk` | Marketing + download links |

## Run

```bash
npm install
npm run streamdesk:dev
```

- Desk agent: terminal shows a **6-digit PIN**, listens on port **8790**
- Phone UI: http://localhost:5174 (use your Mac’s LAN IP from the phone)

Or separately:

```bash
npm run streamdesk:desk
npm run streamdesk:mobile
```

## First pair

1. Start the desk agent on the Mac.
2. On the Mac, open **http://localhost:8790/** — add apps (with icons) and drag to reorder.
3. On the phone UI, enter the Mac IP + PIN and connect.
4. The phone shows that same desk list; tap to open/switch, Close to quit.

Icons are cached in `~/.streamdesk/icons/`. Layout is stored in `~/.streamdesk/layout.json`.

## Permissions

macOS may ask for Automation when quitting or activating apps via AppleScript. Allow StreamDesk / Terminal / Node for System Events as prompted.

## Downloads on the website

After packaging:

```bash
npm run streamdesk:package
```

- `/downloads/streamdesk.apk` — Android app
- `/downloads/StreamDesk-mac.zip` — Mac desk agent (Node 22+, double-click launcher)

Published from `apps/web/public/downloads/` with the marketing site.
