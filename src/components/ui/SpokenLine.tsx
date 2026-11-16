import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import type { Line } from '../../content/dialogue';
import { buddyVoice } from '../../lib/voice/voice';
import styles from './SpokenLine.module.css';

type SpokenLineProps = {
  line: Line;
  /**
   * voice: words turn from grey to ink as Buddy says them (follows the playing line).
   * timed: the same reveal at a steady reading pace, starting when the enclosing
   *        Buddy seat becomes active (for lines without a recording).
   */
  mode: 'voice' | 'timed';
  className?: string;
};

/** Words per second for timed lines (about Buddy's speaking pace). */
const TIMED_WPS = 3.2;

/**
 * Buddy's caption, karaoke style: the whole line is set in light grey and each
 * word darkens to ink as it is spoken, so the text keeps pace with his voice.
 */
export function SpokenLine({ line, mode, className }: SpokenLineProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = [line.lead, line.rest].filter(Boolean).join(' ').split(' ');
  const leadCount = line.lead.split(' ').length;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const spans = Array.from(root.querySelectorAll<HTMLElement>('[data-spoken-word]'));
    const total = spans.reduce((sum, span) => sum + (span.textContent?.length ?? 0) + 1, 0);
    // Each word darkens once the line has reached its first letter.
    let acc = 0;
    const starts = spans.map((span) => {
      const at = acc / total;
      acc += (span.textContent?.length ?? 0) + 1;
      return at;
    });
    const paint = (p: number) => spans.forEach((span, i) => span.toggleAttribute('data-said', p > starts[i] + 0.01));
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (mode === 'voice') {
      let started = false;
      const tick = () => {
        const p = buddyVoice.progress();
        if (p !== null) started = true;
        // Before his voice starts: grey; after it ends: all ink.
        paint(p ?? (started ? 1 : 0));
        if (!(started && p === null)) raf = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(raf);
    }

    const seat = root.closest<HTMLElement>('[data-buddy-seat]');
    const duration = (spans.length / TIMED_WPS) * 1000;
    const play = () => {
      cancelAnimationFrame(raf);
      if (reduced) {
        paint(1);
        return;
      }
      const t0 = performance.now() + 250;
      const tick = (now: number) => {
        const p = Math.max(0, (now - t0) / duration);
        paint(p);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      paint(0);
      raf = requestAnimationFrame(tick);
    };
    if (!seat) {
      play();
      return () => cancelAnimationFrame(raf);
    }
    let active = seat.hasAttribute('data-buddy-active');
    if (active) play();
    else paint(0);
    const observer = new MutationObserver(() => {
      const now = seat.hasAttribute('data-buddy-active');
      if (now && !active) play();
      active = now;
    });
    observer.observe(seat, { attributes: true, attributeFilter: ['data-buddy-active'] });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [mode, line.lead, line.rest]);

  return (
    <span ref={ref} className={[styles.line, className].filter(Boolean).join(' ')}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 ? ' ' : null}
          <span
            className={styles.word}
            data-word
            data-spoken-word
            data-lead={i < leadCount ? '' : undefined}
            style={{ '--w': i } as CSSProperties}
          >
            {word}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
