const PIN_PATTERN = /^[0-9A-F]{4,8}$/;

/**
 * Android TV Remote v2 pairing codes are hexadecimal (typically 6 characters).
 * Spaces, dashes, colons, and similar separators are ignored. Fullwidth
 * characters are folded to ASCII so phone keyboards do not block submit.
 */
export function normalizePairingPin(value: string): string | null {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\s\-.:_·•]/g, "")
    .toUpperCase();
  if (!PIN_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function isPairingPin(value: unknown): value is string {
  return typeof value === "string" && normalizePairingPin(value) !== null;
}
