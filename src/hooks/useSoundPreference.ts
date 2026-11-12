import { useCallback, useState } from 'react';

const STORAGE_KEY = 'buddy:sound';

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

/**
 * The visitor's sound preference. Off by default; persisted per browser.
 * M1 stores the choice only — audio arrives with the entry sequence (M2).
 */
export function useSoundPreference() {
  const [enabled, setEnabled] = useState<boolean>(readStored);

  const toggle = useCallback(() => {
    setEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      } catch {
        /* storage unavailable (private mode); keep in-memory state */
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}
