import { useSyncExternalStore } from 'react';
import type { Line } from '../../content/dialogue';

/**
 * What Buddy is saying right now (null = his resting line for the seat).
 * The intro script sets it line by line; the hero caption shows it.
 */
let current: Line | null = null;
const listeners = new Set<() => void>();

export const buddySpeech = {
  set(line: Line | null): void {
    current = line;
    listeners.forEach((listener) => listener());
  },
};

export function useBuddySpeech(): Line | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => null,
  );
}
