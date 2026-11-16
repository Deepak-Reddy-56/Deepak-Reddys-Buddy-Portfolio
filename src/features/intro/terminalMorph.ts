import { easeInOutCubic, easeOutCubic, progress } from '../../lib/easing';

/**
 * After Run, in ms. One chrome surface throughout: the terminal's own box is
 * taken over by Buddy's Liquid Metal body, which shrinks while still a
 * rectangle and only rounds into his silhouette once he is small — there is
 * never a large rounded blob — then his face appears and he settles.
 */
export const morph = {
  line1: 150,
  line2: 650,
  /** The commands have "loaded": Buddy's surface takes over the terminal box. */
  swap: 1500,
  shrink: [1550, 2450],
  form: [1850, 2950],
  face: [2950, 3750],
  revealPage: 3450,
  /** He looks around for a couple of seconds before he starts talking. */
  look: [3800, 5900],
  done: 6000,
} as const;

/** The longest the terminal may wait (after Run) for the live Buddy before the page just appears. */
export const READY_LIMIT_MS = 3500;

export type MorphFrame = { shrink: number; form: number; face: number; lookX: number; lookY: number; blink: number; curious: boolean };

export function morphAt(t: number): MorphFrame {
  const m = morph;
  const shrink = easeOutCubic(progress(t, ...m.shrink));
  const form = easeInOutCubic(progress(t, ...m.form));
  const face = progress(t, ...m.face);
  const l = progress(t, ...m.look);
  const glance = (from: number, to: number) => easeInOutCubic(progress(l, from, to));
  const lookX = -0.85 * glance(0, 0.16) + 1.55 * glance(0.36, 0.52) - 0.7 * glance(0.78, 0.94);
  const lookY = 0.12 * glance(0, 0.16) - 0.06 * glance(0.36, 0.52) - 0.06 * glance(0.78, 0.94);
  const b = progress(l, 0.6, 0.73);
  const blink = b > 0 && b < 1 ? Math.sin(Math.PI * b) : 0;
  return { shrink, form, face, lookX, lookY, blink, curious: l > 0 && l < 0.94 };
}
