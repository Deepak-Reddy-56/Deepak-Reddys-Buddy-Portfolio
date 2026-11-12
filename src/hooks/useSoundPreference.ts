import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from '../lib/audio/soundEngine';

const STORAGE_KEY = 'buddy:sound';

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

function store(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable (private mode); keep in-memory state */
  }
}

/**
 * The visitor's sound preference. Off by default; persisted per browser.
 * Changing it is always a user gesture, so it also unlocks the audio engine.
 */
export function useSoundPreference() {
  const [enabled, setEnabledState] = useState<boolean>(readStored);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
    soundEngine.setEnabled(enabled);
  }, [enabled]);

  const set = useCallback((next: boolean) => {
    soundEngine.unlock();
    soundEngine.setEnabled(next);
    enabledRef.current = next;
    if (next) soundEngine.play('toggle');
    store(next);
    setEnabledState(next);
  }, []);

  const toggle = useCallback(() => set(!enabledRef.current), [set]);

  return { enabled, set, toggle, supported: soundEngine.supported };
}
