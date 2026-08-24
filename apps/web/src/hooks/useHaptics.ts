import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useCallback } from "react";

export function useHaptics(): (pattern?: number | number[]) => void {
  return useCallback((pattern: number | number[] = 12) => {
    if (Capacitor.isNativePlatform()) {
      const style = Array.isArray(pattern) ? ImpactStyle.Medium : ImpactStyle.Light;
      void Haptics.impact({ style });
      return;
    }
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  }, []);
}
