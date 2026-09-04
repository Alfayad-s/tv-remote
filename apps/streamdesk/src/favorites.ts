const FAVORITES_KEY = "streamdesk.favorites.v1";

export function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function writeFavorites(ids: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleFavorite(id: string): string[] {
  const current = readFavorites();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  writeFavorites(next);
  return next;
}
