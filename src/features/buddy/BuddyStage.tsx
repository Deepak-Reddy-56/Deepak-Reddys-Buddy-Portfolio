import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { debugFlag } from '../../lib/debug';
import styles from './BuddyStage.module.css';

type Buddy = Awaited<ReturnType<typeof import('./three/createBuddy')['createBuddy']>>;

function setBuddyMode(mode: '3d' | null): void {
  const root = document.documentElement;
  if (mode) root.dataset.buddy = mode;
  else delete root.dataset.buddy;
}

/**
 * The one persistent Buddy: a single click-through canvas over the page.
 * Seats (BuddySeat) only reserve space; this character flies between them.
 * Falls back to the static per-seat placeholders when motion is reduced,
 * WebGL is unavailable, or the context is lost.
 */
export function BuddyStage({ menuOpen }: { menuOpen: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buddyRef = useRef<Buddy | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion) return;
    let cancelled = false;
    let buddy: Buddy | null = null;

    const fallBack = () => {
      buddy?.dispose();
      buddy = null;
      buddyRef.current = null;
      setBuddyMode(null);
    };

    import('./three/createBuddy')
      .then(({ createBuddy }) => {
        if (cancelled) return;
        buddy = createBuddy(canvas, fallBack);
        buddyRef.current = buddy;
        setBuddyMode('3d');
        if (__DEBUG__ && debugFlag('buddyDebug')) (window as unknown as { __buddy?: () => unknown }).__buddy = () => buddy?.director.snapshot();
      })
      .catch(fallBack);

    return () => {
      cancelled = true;
      fallBack();
    };
  }, [reducedMotion]);

  useEffect(() => {
    buddyRef.current?.director.setMenuOpen(menuOpen);
  }, [menuOpen]);

  if (reducedMotion) return null;
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
