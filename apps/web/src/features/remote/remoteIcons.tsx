import type { LucideIcon } from "lucide-react";
import {
  ChevronUp,
  Clock3,
  CornerDownLeft,
  Delete,
  FastForward,
  Gamepad2,
  House,
  Keyboard,
  Pause,
  Play,
  Pointer,
  Power,
  Rewind,
  SkipBack,
  SkipForward,
  Speaker,
  Undo2,
  VolumeX,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

function RemoteIcon({
  icon: Icon,
  size = "size-5",
  strokeWidth = 1.75,
}: {
  icon: LucideIcon;
  size?: string;
  strokeWidth?: number;
}): ReactNode {
  return <Icon className={size} strokeWidth={strokeWidth} aria-hidden="true" />;
}

export function IconPower(): ReactNode {
  return <RemoteIcon icon={Power} size="size-6" />;
}

export function IconClock(): ReactNode {
  return <RemoteIcon icon={Clock3} />;
}

export function IconMute(): ReactNode {
  return <RemoteIcon icon={VolumeX} />;
}

export function IconCaret({ rotate = 0 }: { rotate?: number }): ReactNode {
  return (
    <ChevronUp
      className="size-6"
      strokeWidth={2.4}
      aria-hidden="true"
      style={{ transform: `rotate(${String(rotate)}deg)` }}
    />
  );
}

export function IconBack(): ReactNode {
  return <RemoteIcon icon={Undo2} />;
}

export function IconHome(): ReactNode {
  return <RemoteIcon icon={House} />;
}

export function IconPlayPause(): ReactNode {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      <Play className="size-4" strokeWidth={1.75} fill="currentColor" />
      <Pause className="size-4" strokeWidth={1.75} fill="currentColor" />
    </span>
  );
}

export function IconSkip({ forward = false }: { forward?: boolean }): ReactNode {
  return <RemoteIcon icon={forward ? SkipForward : SkipBack} />;
}

export function IconSeek({ forward = false }: { forward?: boolean }): ReactNode {
  return <RemoteIcon icon={forward ? FastForward : Rewind} />;
}

export function IconKeyboard(): ReactNode {
  return <RemoteIcon icon={Keyboard} />;
}

export function IconClose(): ReactNode {
  return <RemoteIcon icon={X} />;
}

export function IconBackspace(): ReactNode {
  return <RemoteIcon icon={Delete} />;
}

export function IconEnter(): ReactNode {
  return <RemoteIcon icon={CornerDownLeft} />;
}

export function IconTabRemote(): ReactNode {
  return <RemoteIcon icon={Gamepad2} size="size-4" />;
}

export function IconTabTouchpad(): ReactNode {
  return <RemoteIcon icon={Pointer} size="size-4" />;
}

export function IconSpeaker(): ReactNode {
  return <RemoteIcon icon={Speaker} />;
}
