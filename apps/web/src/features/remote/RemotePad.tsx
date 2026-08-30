import type { RemoteCommand } from "@tv-remote/shared";
import { useEffect, useState } from "react";
import { formatRemoteTime, useClock } from "../../hooks/useClock.js";
import { useConnection } from "../../hooks/useConnection.js";
import { RemoteKey } from "./RemoteKey.js";
import { REMOTE_APPS } from "./tvApps.js";
import {
  IconBack,
  IconCaret,
  IconClock,
  IconHome,
  IconKeyboard,
  IconMute,
  IconPlayPause,
  IconPower,
  IconSeek,
  IconSkip,
} from "./remoteIcons.js";

const TIME_DETAIL_MS = 4000;

function TimeKey() {
  const now = useClock();
  const [detailed, setDetailed] = useState(false);

  useEffect(() => {
    if (!detailed) {
      return;
    }
    const id = window.setTimeout(() => {
      setDetailed(false);
    }, TIME_DETAIL_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [detailed]);

  return (
    <RemoteKey
      label="Time"
      flush
      tone="ok"
      className="remote-key-h"
      onPress={() => {
        setDetailed(true);
      }}
    >
      <span className="flex items-center gap-1.5 leading-none">
        <IconClock />
        <span className="text-sm font-semibold tabular-nums tracking-wide">
          {formatRemoteTime(now, detailed)}
        </span>
      </span>
    </RemoteKey>
  );
}

function DPad({
  disabled,
  press,
}: {
  disabled: boolean;
  press: (command: RemoteCommand) => () => void;
}) {
  return (
    <div className="remote-dpad relative shrink-0" aria-label="Direction pad">
      <div className="absolute inset-0 rotate-[4deg] rounded-full bg-ink" />
      <div className="absolute inset-[6px] rounded-full border-[5px] border-ink bg-paper" />

      <RemoteKey
        label="Up"
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="absolute left-1/2 top-[4%] h-[24%] w-[30%] -translate-x-1/2 rounded-full"
        onPress={press("UP")}
      >
        <IconCaret />
      </RemoteKey>
      <RemoteKey
        label="Left"
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="absolute left-[4%] top-1/2 h-[30%] w-[24%] -translate-y-1/2 rounded-full"
        onPress={press("LEFT")}
      >
        <IconCaret rotate={-90} />
      </RemoteKey>
      <RemoteKey
        label="OK"
        disabled={disabled}
        flush
        tone="core"
        className="absolute left-1/2 top-1/2 size-[36%] -translate-x-1/2 -translate-y-1/2 rounded-full text-base tracking-[0.2em]"
        onPress={press("OK")}
      >
        OK
      </RemoteKey>
      <RemoteKey
        label="Right"
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="absolute right-[4%] top-1/2 h-[30%] w-[24%] -translate-y-1/2 rounded-full"
        onPress={press("RIGHT")}
      >
        <IconCaret rotate={90} />
      </RemoteKey>
      <RemoteKey
        label="Down"
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="absolute bottom-[4%] left-1/2 h-[24%] w-[30%] -translate-x-1/2 rounded-full"
        onPress={press("DOWN")}
      >
        <IconCaret rotate={180} />
      </RemoteKey>
    </div>
  );
}

function Rocker({
  name,
  upLabel,
  downLabel,
  disabled,
  onUp,
  onDown,
}: {
  name: string;
  upLabel: string;
  downLabel: string;
  disabled: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="remote-rocker">
      <RemoteKey
        label={upLabel}
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="flex-1 rounded-none text-2xl font-semibold"
        onPress={onUp}
      >
        +
      </RemoteKey>
      <span
        className={`border-y-[3px] border-ink py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.18em] ${
          name === "Vol" ? "bg-blue text-paper" : "bg-green text-ink"
        }`}
      >
        {name}
      </span>
      <RemoteKey
        label={downLabel}
        disabled={disabled}
        repeat
        flush
        tone="bare"
        className="flex-1 rounded-none text-2xl font-semibold"
        onPress={onDown}
      >
        −
      </RemoteKey>
    </div>
  );
}

export function RemotePad({
  disabled,
  onOpenKeyboard,
}: {
  disabled: boolean;
  onOpenKeyboard?: () => void;
}) {
  const { sendCommand, launchApp } = useConnection();
  const press = (command: RemoteCommand) => () => {
    sendCommand(command);
  };

  return (
    <section className="remote-pad" aria-label="Remote controls">
      <RemoteKey
        label="Power"
        disabled={disabled}
        tone="power"
        flush
        className="remote-power remote-key-h w-[min(14.5rem,92%)] font-display text-[15px] tracking-[0.08em]"
        onPress={press("POWER")}
      >
        <span className="flex items-center gap-2">
          <IconPower />
          Power
        </span>
      </RemoteKey>

      <div className="remote-home remote-row grid grid-cols-2 gap-2 sm:gap-3">
        <RemoteKey
          label="Home"
          disabled={disabled}
          flush
          tone="blue"
          className="remote-key-h"
          onPress={press("HOME")}
        >
          <span className="flex items-center gap-2">
            <IconHome />
            Home
          </span>
        </RemoteKey>
        <TimeKey />
      </div>

      <div className="remote-apps remote-row grid grid-cols-3 gap-2 sm:gap-3" aria-label="Apps">
        {REMOTE_APPS.map((app) => (
          <RemoteKey
            key={app.id}
            label={app.label}
            disabled={disabled}
            flush
            tone="light"
            className={`remote-app-h overflow-hidden p-1.5 ${
              app.id === "youtube"
                ? "bg-violet text-paper"
                : app.id === "hotstar"
                  ? "bg-green"
                  : "bg-paper"
            }`}
            onPress={() => {
              launchApp(app.id);
            }}
          >
            <img
              src={app.icon}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-contain"
            />
          </RemoteKey>
        ))}
      </div>

      <div className="remote-dpad-wrap">
        <DPad disabled={disabled} press={press} />
      </div>

      <div className="remote-actions remote-row grid grid-cols-3 gap-2">
        <RemoteKey
          label="Back"
          disabled={disabled}
          flush
          className="remote-key-h flex-col gap-1 font-mono text-[10.5px]"
          onPress={press("BACK")}
        >
          <span className="flex items-center gap-1.5 sm:gap-2">
            <IconBack />
            Back
          </span>
        </RemoteKey>
        <RemoteKey
          label="Open keyboard"
          disabled={disabled}
          flush
          className="remote-key-h"
          onPress={() => {
              onOpenKeyboard?.();
            }}
        >
          <IconKeyboard />
        </RemoteKey>
        <RemoteKey
          label="Mute"
          disabled={disabled}
          flush
          className="remote-key-h flex-col gap-1 font-mono text-[10.5px]"
          onPress={press("MUTE")}
        >
          <span className="flex items-center gap-1.5 sm:gap-2">
            <IconMute />
            Mute
          </span>
        </RemoteKey>
      </div>

      <div className="remote-vol-row">
        <Rocker
          name="Vol"
          upLabel="Volume up"
          downLabel="Volume down"
          disabled={disabled}
          onUp={press("VOLUME_UP")}
          onDown={press("VOLUME_DOWN")}
        />
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
          <RemoteKey
            label="Play pause"
            disabled={disabled}
            flush
            className="remote-key-h w-full max-w-[7.5rem] bg-accent-strong"
            onPress={press("PLAY_PAUSE")}
          >
            <IconPlayPause />
          </RemoteKey>
        </div>
        <Rocker
          name="Ch"
          upLabel="Channel up"
          downLabel="Channel down"
          disabled={disabled}
          onUp={press("CHANNEL_UP")}
          onDown={press("CHANNEL_DOWN")}
        />
      </div>

      <div className="remote-media remote-row grid grid-cols-4 gap-2">
        <RemoteKey
          label="Previous"
          disabled={disabled}
          tone="quiet"
          flush
          className="remote-key-h rounded-full"
          onPress={press("PREVIOUS")}
        >
          <IconSkip />
        </RemoteKey>
        <RemoteKey
          label="Rewind"
          disabled={disabled}
          tone="quiet"
          flush
          className="remote-key-h rounded-full"
          onPress={press("REWIND")}
        >
          <IconSeek />
        </RemoteKey>
        <RemoteKey
          label="Fast forward"
          disabled={disabled}
          tone="quiet"
          flush
          className="remote-key-h rounded-full"
          onPress={press("FAST_FORWARD")}
        >
          <IconSeek forward />
        </RemoteKey>
        <RemoteKey
          label="Next"
          disabled={disabled}
          tone="quiet"
          flush
          className="remote-key-h rounded-full"
          onPress={press("NEXT")}
        >
          <IconSkip forward />
        </RemoteKey>
      </div>
    </section>
  );
}
