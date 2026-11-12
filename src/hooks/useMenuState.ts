import { useCallback, useEffect, useRef, useState } from 'react';
import { readDuration } from '../lib/motion';

export type MenuPhase = 'closed' | 'open' | 'closing';

/**
 * Open/close state machine for the menu sheet. Keeps the sheet mounted during
 * 'closing' so it can animate out; the timer matches --dur-menu-close (which
 * is 0 under reduced motion).
 */
export function useMenuState() {
  const [phase, setPhaseState] = useState<MenuPhase>('closed');
  const phaseRef = useRef<MenuPhase>('closed');
  const timer = useRef<number | undefined>(undefined);

  const setPhase = useCallback((next: MenuPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const open = useCallback(() => {
    window.clearTimeout(timer.current);
    setPhase('open');
  }, [setPhase]);

  const close = useCallback(() => {
    if (phaseRef.current !== 'open') return;
    setPhase('closing');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPhase('closed'), readDuration('--dur-menu-close'));
  }, [setPhase]);

  const toggle = useCallback(() => {
    if (phaseRef.current === 'open') close();
    else open();
  }, [open, close]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return { phase, isOpen: phase === 'open', isMounted: phase !== 'closed', open, close, toggle };
}
