import type { RemoteCommand } from "@tv-remote/shared";
import { useEffect, useState } from "react";
import { formatRemoteTime, useClock } from "../../hooks/useClock.js";
import { useConnection } from "../../hooks/useConnection.js";
import { RemoteKey } from "./RemoteKey.js";
import { TouchPad } from "./TouchPad.js";
import {
  IconBack,
  IconChevron,
  IconClock,
  IconHome,
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
      onPress={() => {
        setDetailed(true);
      }}
    >
      <span className="flex flex-col items-center gap-0.5 leading-tight">
        <IconClock />
        <span className="text-[11px] font-semibold tabular-nums tracking-wide">
          {formatRemoteTime(now, detailed)}
        </span>
      </span>
    </RemoteKey>
  );
}

export function RemotePad({ disabled }: { disabled: boolean }) {
  const { sendCommand } = useConnection();
  const press = (command: RemoteCommand) => () => {
    sendCommand(command);
  };

  return (
    <section className="flex flex-col gap-4" aria-label="Remote controls">
      <div className="grid grid-cols-3 gap-3">
        <RemoteKey label="Power" disabled={disabled} tone="danger" onPress={press("POWER")}>
          <span className="flex items-center gap-2">
            <IconPower />
            Power
          </span>
        </RemoteKey>
        <TimeKey />
        <RemoteKey label="Mute" disabled={disabled} onPress={press("MUTE")}>
          <span className="flex items-center gap-2">
            <IconMute />
            Mute
          </span>
        </RemoteKey>
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="grid size-[13.75rem] grid-cols-3 grid-rows-3 gap-2">
          <div />
          <RemoteKey label="Up" disabled={disabled} repeat onPress={press("UP")}>
            <IconChevron />
          </RemoteKey>
          <div />
          <RemoteKey label="Left" disabled={disabled} repeat onPress={press("LEFT")}>
            <IconChevron rotate={-90} />
          </RemoteKey>
          <RemoteKey
            label="OK"
            disabled={disabled}
            tone="ok"
            className="rounded-full"
            onPress={press("OK")}
          >
            OK
          </RemoteKey>
          <RemoteKey label="Right" disabled={disabled} repeat onPress={press("RIGHT")}>
            <IconChevron rotate={90} />
          </RemoteKey>
          <div />
          <RemoteKey label="Down" disabled={disabled} repeat onPress={press("DOWN")}>
            <IconChevron rotate={180} />
          </RemoteKey>
          <div />
        </div>

        <div className="flex w-16 flex-col gap-2">
          <RemoteKey
            label="Volume up"
            disabled={disabled}
            repeat
            className="min-h-16"
            onPress={press("VOLUME_UP")}
          >
            +
          </RemoteKey>
          <p className="text-center text-[10px] uppercase tracking-[0.18em] text-cyan-100/40">
            Vol
          </p>
          <RemoteKey
            label="Volume down"
            disabled={disabled}
            repeat
            className="min-h-16"
            onPress={press("VOLUME_DOWN")}
          >
            −
          </RemoteKey>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <RemoteKey label="Back" disabled={disabled} onPress={press("BACK")}>
          <span className="flex items-center gap-2">
            <IconBack />
            Back
          </span>
        </RemoteKey>
        <RemoteKey label="Home" disabled={disabled} onPress={press("HOME")}>
          <span className="flex items-center gap-2">
            <IconHome />
            Home
          </span>
        </RemoteKey>
      </div>

      <div className="grid grid-cols-5 gap-2">
        <RemoteKey label="Previous" disabled={disabled} tone="quiet" onPress={press("PREVIOUS")}>
          <IconSkip />
        </RemoteKey>
        <RemoteKey label="Rewind" disabled={disabled} tone="quiet" onPress={press("REWIND")}>
          <IconSeek />
        </RemoteKey>
        <RemoteKey label="Play pause" disabled={disabled} onPress={press("PLAY_PAUSE")}>
          <IconPlayPause />
        </RemoteKey>
        <RemoteKey
          label="Fast forward"
          disabled={disabled}
          tone="quiet"
          onPress={press("FAST_FORWARD")}
        >
          <IconSeek forward />
        </RemoteKey>
        <RemoteKey label="Next" disabled={disabled} tone="quiet" onPress={press("NEXT")}>
          <IconSkip forward />
        </RemoteKey>
      </div>

      <TouchPad disabled={disabled} compact />
    </section>
  );
}
