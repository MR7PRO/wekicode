import { useCallback, useEffect, useRef, useState } from "react";

/** Debounced local-only draft persistence. Never syncs to the server. */
export function useLocalDraft<T extends Record<string, unknown>>(key: string, value: T, enabled = true) {
  const [restored, setRestored] = useState<T | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const first = useRef(true);
  const storageKey = `wekicode.draft.${key}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setRestored(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const hasContent = Object.values(value).some((v) => typeof v === "string" && v.trim().length > 0);
    const t = setTimeout(() => {
      if (!hasContent) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
        setSavedAt(Date.now());
      } catch {
        /* ignore */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [value, enabled, storageKey]);

  const clear = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRestored(null);
    setSavedAt(null);
  }, [storageKey]);

  const discardRestored = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRestored(null);
  }, [storageKey]);

  return { restored, savedAt, clear, discardRestored };
}