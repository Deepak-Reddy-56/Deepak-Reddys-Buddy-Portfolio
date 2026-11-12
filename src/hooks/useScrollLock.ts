import { useEffect } from 'react';

/**
 * Locks page scrolling while `locked` is true. Compensates for the scrollbar
 * width (via --scrollbar-comp) so the page and the fixed controls don't shift.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;

    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const previousOverflow = root.style.overflow;

    root.style.setProperty('--scrollbar-comp', `${scrollbarWidth}px`);
    root.style.overflow = 'hidden';

    return () => {
      root.style.overflow = previousOverflow;
      root.style.setProperty('--scrollbar-comp', '0px');
    };
  }, [locked]);
}
