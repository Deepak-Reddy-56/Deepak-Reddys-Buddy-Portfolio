import { useEffect, useLayoutEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { debugFlag } from '../../lib/debug';
import { BuddyDirector } from './BuddyDirector';
import { buddyHost } from './buddyHost';
import { PaperBuddyView } from './PaperBuddyView';
import styles from './BuddyStage.module.css';

/**
 * Mounts the one Buddy for the whole visit — intro included — and wires it to
 * the director. There is no second renderer and no stand-in character: while
 * the live renderer starts, the seats are simply reserved space.
 */
export function BuddyStage({ menuOpen }: { menuOpen: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const directorRef = useRef<BuddyDirector | null>(null);
  const reducedMotion = useReducedMotion();

  // Before first paint: the page starts in 'loading' (captions wait for Buddy, nothing stands in for him).
  useLayoutEffect(() => {
    if (!document.documentElement.dataset.buddy) document.documentElement.dataset.buddy = 'loading';
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const view = new PaperBuddyView(root, {
      reducedMotion,
      onStatus: (status) => buddyHost.report(view, status),
    });
    buddyHost.attach(view);
    const director = new BuddyDirector(view, { reducedMotion });
    directorRef.current = director;
    if (__DEBUG__ && debugFlag('buddyDebug')) {
      (window as unknown as { __buddy?: () => unknown }).__buddy = () => ({ status: view.status, ...director.snapshot() });
    }
    return () => {
      director.dispose();
      directorRef.current = null;
      view.dispose();
      buddyHost.detach(view);
    };
  }, [reducedMotion]);

  useEffect(() => {
    directorRef.current?.setMenuOpen(menuOpen);
  }, [menuOpen]);

  return <div ref={rootRef} className={styles.buddy} aria-hidden="true" />;
}
