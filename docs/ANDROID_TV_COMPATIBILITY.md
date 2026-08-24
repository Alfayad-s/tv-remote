# Android TV / iFFALCON compatibility

This file tracks what the **Android TV Remote v2** protocol can do, and what still has to be verified on the physical iFFALCON set.

Do not treat this as confirmed device support until a command has been tested on the TV.

iFFALCON models that ship with **Google TV** or **Android TV** typically include Google's **Android TV Remote Service**. That is a different pairing flow from pairing the Bluetooth hardware remote (Home + OK on the physical clicker).

## Protocol notes

| Item         | Detail                                                                      |
| ------------ | --------------------------------------------------------------------------- |
| Protocol     | Android TV Remote v2 (Remote Service ≥ 5, widely deployed since 2021)       |
| Pairing port | TCP **6467** over TLS, client certificate required                          |
| Command port | TCP **6466** over TLS, same client certificate after pairing                |
| Discovery    | mDNS `_androidtvremote2._tcp.local` (v2). Also scan `_androidtvremote._tcp` |

| Commands | Android `KeyEvent` keycodes sent as protocol frames |
| Pairing UX | TV shows a PIN / short code; client proves it over TLS |
| Browser access | **Not possible.** Chrome cannot open these TLS sockets from a PWA. |

Useful references (unofficial reverse-engineering, not an iFFALCON SDK):

- Android TV Remote v2 write-up (ports 6466/6467, pairing hash, key events)
- Node implementations such as `androidtv-remote` / `@kud/androidtv-remote`
- Python `androidtvremote2` (used in Home Assistant)

None of those libraries are an iFFALCON SDK. This project uses `@kud/androidtv-remote` on the Node service only. The PWA never imports it.

## Confirmed supported

Confirmed for this project architecture, not yet for the physical TV:

- Local Node.js process can use TCP/TLS; the PWA cannot
- Typed WebSocket commands can reach a `TVAdapter`
- `MockTVAdapter` accepts the shared `RemoteCommand` set
- Discovery browses `_androidtvremote2._tcp` and `_androidtvremote._tcp`
- Manual IPv4 fallback is available when mDNS is blocked
- `AndroidTVAdapter` can pair, persist the client certificate, reconnect without a PIN, and send protocol keycodes (HOME is wired in the PWA)
- Pairing PIN is 4–8 hex characters; typical Google TV codes are 6 hex digits

Nothing on the physical iFFALCON advertisement is confirmed until a live scan on your Wi-Fi. If a set appears, record its service type and instance name here.

## Likely supported

Likely on iFFALCON Google TV / Android TV if Remote Service is enabled and ports are reachable:

- PIN pairing on 6467
- Persistent client certificate after a successful pair
- D-pad, OK, Back, Home
- Volume up / down / mute
- Power (standby / wake behavior varies by OEM)
- Play / pause and other media keycodes
- IME text injection for on-screen search fields

These are standard Android TV Remote v2 capabilities. They still need a live test.

## Requires testing

| Capability                        | Why it needs a device test                                                  |
| --------------------------------- | --------------------------------------------------------------------------- |
| mDNS advertisement name           | iFFALCON should use `_androidtvremote2._tcp`; confirm instance name and TXT |
| Wake from deep sleep / WoL        | Many TVs ignore network keys while fully off                                |
| Channel up / down                 | Only meaningful if a tuner/live-TV app handles those keycodes               |
| Input / source                    | Often not a standard remote-service key; may be unavailable                 |
| Installed app list                | Not guaranteed by the protocol                                              |
| App launch via deep link          | YouTube/Netflix links may work; do not assume every app                     |
| Current app / volume state events | Present in some v2 implementations, not all OEM builds                      |
| On-screen text field (IME)        | `RemoteImeKeyInject` is treated as a focused search/text field              |
| IFFALCON-specific firmware        | Power, CEC, and live-TV apps vary by model/region                           |
| Multiple simultaneous remotes     | Unknown whether a second client kicks the first                             |

## Not supported

- Direct PWA → TV protocol (no raw TCP/TLS in the browser)
- Controlling the TV from outside the LAN without a separate tunnel you explicitly set up
- Official Google third-party Remote SDK for this app
- Hardware Bluetooth remote pairing (Home + OK on the clicker) as a substitute for network pairing
- Pretending a command works when the adapter or TV rejects it
- A free-roaming mouse cursor / pointer HID (the PWA touchpad sends D-pad `UP`/`DOWN`/`LEFT`/`RIGHT` and tap = `OK`)

## First on-device experiment

1. TV and computer on the same Wi-Fi.
2. Confirm TCP 6466 and 6467 from the computer (`nc` / `nmap`) if pairing fails immediately.
3. Connect from the PWA with the TV's LAN IP (discovered or typed).
4. Pair with the on-screen PIN.
5. Send **HOME** only.
6. Record the result here (model number, firmware, what happened).

`TV_ADAPTER=mock` is still the right default: loopback stays on the mock TV so the UI can be used without the set.
