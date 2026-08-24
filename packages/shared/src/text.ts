export const MAX_SEND_TEXT_CHARS = 256;

export function normalizeSendText(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_SEND_TEXT_CHARS) {
    return null;
  }
  return value;
}
