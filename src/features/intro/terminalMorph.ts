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
  look: [3800, 6300],
  done: 6400,
} as const;

/** The longest the terminal may wait (after Run) for the live Buddy before the page just appears. */
export const READY_LIMIT_MS = 3500;

/** [progress through the look window, gaze x, gaze y] — moves and holds. */
const LOOK_KEYS: [number, number, number][] = [
  [0, 0, 0],
  [0.08, -0.95, 0.15],
  [0.22, -0.95, 0.15],
  [0.3, 0.6, 0.75],
  [0.44, 0.6, 0.75],
  [0.52, 1, -0.1],
  [0.66, 1, -0.1],
  [0.74, -0.5, -0.6],
  [0.84, -0.5, -0.6],
  [0.93, 0, 0],
  [1, 0, 0],
];

export type MorphFrame = { shrink: number; form: number; face: number; lookX: number; lookY: number; blink: number; curious: boolean };

export function morphAt(t: number): MorphFrame {
  const m = morph;
  const shrink = easeOutCubic(progress(t, ...m.shrink));
  const form = easeInOutCubic(progress(t, ...m.form));
  const face = progress(t, ...m.face);
  const l = progress(t, ...m.look);
  // Look-around: left, up to the right, right, down to the left, back to the visitor
  // (eyes and head follow these together), with a blink in the middle.
  let lookX = 0;
  let lookY = 0;
  for (let i = 1; i < LOOK_KEYS.length; i++) {
    const [t0, x0, y0] = LOOK_KEYS[i - 1];
    const [t1, x1, y1] = LOOK_KEYS[i];
    if (l <= t1) {
      const k = easeInOutCubic(progress(l, t0, t1));
      lookX = x0 + (x1 - x0) * k;
      lookY = y0 + (y1 - y0) * k;
      break;
    }
  }
  const b = progress(l, 0.47, 0.55);
  const blink = b > 0 && b < 1 ? Math.sin(Math.PI * b) : 0;
  return { shrink, form, face, lookX, lookY, blink, curious: l > 0 && l < 0.94 };
}
