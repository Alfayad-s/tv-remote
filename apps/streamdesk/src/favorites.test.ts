import { beforeEach, describe, expect, it } from "vitest";
import { readFavorites, toggleFavorite, writeFavorites } from "./favorites.js";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  });
});

describe("favorites", () => {
  it("toggles favorites in localStorage", () => {
    writeFavorites([]);
    expect(readFavorites()).toEqual([]);
    expect(toggleFavorite("Safari")).toEqual(["Safari"]);
    expect(toggleFavorite("Safari")).toEqual([]);
  });
});
