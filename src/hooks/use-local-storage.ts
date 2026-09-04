"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * localStorage-backed state. Starts from `initialValue` on both server and
 * first client render, then hydrates from storage in an effect — reading during
 * render would produce a hydration mismatch.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored) as T);
    } catch {
      // Unparseable or unavailable storage: keep the initial value.
    }
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Private mode or quota exceeded: state still updates in memory.
      }
    },
    [key],
  );

  return [value, update] as const;
}
