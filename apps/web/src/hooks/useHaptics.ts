import { useCallback } from "react";

export function useHaptics(): (pattern?: number | number[]) => void {
  return useCallback((pattern: number | number[] = 12) => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  }, []);
}
