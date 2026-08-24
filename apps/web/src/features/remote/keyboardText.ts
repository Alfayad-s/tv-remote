export const KEYBOARD_FLUSH_MS = 180;

export interface TypedTextDelta {
  backspaces: number;
  insert: string;
}

export function diffTypedText(previous: string, next: string): TypedTextDelta {
  const prev = Array.from(previous);
  const nxt = Array.from(next);
  let prefix = 0;
  const limit = Math.min(prev.length, nxt.length);
  while (prefix < limit && prev[prefix] === nxt[prefix]) {
    prefix += 1;
  }
  return {
    backspaces: prev.length - prefix,
    insert: nxt.slice(prefix).join(""),
  };
}
