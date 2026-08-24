import { useEffect, useState } from "react";

const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

const DETAIL_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
};

export function formatRemoteTime(date: Date, detailed = false): string {
  return new Intl.DateTimeFormat(undefined, detailed ? DETAIL_FORMAT : TIME_FORMAT).format(date);
}

export function useClock(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date());
    }, intervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [intervalMs]);

  return now;
}
