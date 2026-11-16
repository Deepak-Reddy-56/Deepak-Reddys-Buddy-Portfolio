import { useSyncExternalStore } from 'react';
import type { Line } from '../../content/dialogue';

/**
 * A situational line Buddy is saying at a seat (outfit change, "you're back",
 * "ahem"). The seat shows it in place of its resting line until he leaves.
 */
export type ActiveQuip = { seat: string; line: Line; key: number };

let current: ActiveQuip | null = null;
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const buddyQuip = {
  say(seat: string, line: Line): void {
    current = { seat, line, key: ++counter };
    emit();
  },
  clear(seat?: string): void {
    if (!current || (seat && current.seat !== seat)) return;
    current = null;
    emit();
  },
  get current(): ActiveQuip | null {
    return current;
  },
};

export function useBuddyQuip(seat: string): ActiveQuip | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => (current && current.seat === seat ? current : null),
    () => null,
  );
}
