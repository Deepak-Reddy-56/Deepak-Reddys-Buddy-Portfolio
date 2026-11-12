import { useCallback, useRef, useState } from 'react';

const SEEN_KEY = 'buddy:intro-seen';

/**
 * Plays the intro on a first visit only. Return visits, deep links (#work…)
 * go straight to the page; `?intro` forces it; replay() runs it again.
 */
function shouldAutoplay(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (params.has('intro')) return true;
  if (window.location.hash && window.location.hash !== '#home') return false;
  try {
    return window.localStorage.getItem(SEEN_KEY) !== '1';
  } catch {
    return true;
  }
}

export type IntroEnd = 'done' | 'skip';

export function useIntroGate() {
  const counter = useRef(0);
  const [runKey, setRunKey] = useState<number>(() => (shouldAutoplay() ? ++counter.current : 0));

  const finish = useCallback((_reason: IntroEnd) => {
    try {
      window.localStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable: the intro may show again next visit */
    }
    setRunKey(0);
  }, []);

  const replay = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setRunKey(++counter.current);
  }, []);

  return { active: runKey > 0, runKey, finish, replay };
}
