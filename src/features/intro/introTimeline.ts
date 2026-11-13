import { dampedWobble, easeInOutCubic, easeOutCubic, lerp, progress } from '../../lib/easing';

/**
 * One continuous, in-place transformation:
 * terminal rectangle -> cohesive liquid-metal pebble -> Buddy.
 * The terminal is aligned to the hero seat before the first frame, so the
 * centre never translates and Buddy is already where he will remain.
 */
export const marks = {
  outputEnd: 620,
  swapStart: 560,
  swapEnd: 780,
  chrome: [680, 1420],
  morph: [760, 1940],
  face: [1990, 2370],
  smile: [2290, 2630],
  revealPage: [2670, 3300],
  blink: [3160, 3320],
  handoff: [3400, 3680],
  done: 3740,
} as const;

export type Box = { cx: number; cy: number; hw: number; hh: number };

export type IntroUniforms = {
  center: [number, number];
  half: [number, number];
  radius: number;
  morph: number;
  liquid: number;
  chrome: number;
  face: number;
  smile: number;
  blink: number;
  settle: number;
  alpha: number;
};

export function boxFromRect(rect: DOMRect): Box {
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, hw: rect.width / 2, hh: rect.height / 2 };
}

/** Body changes shape and dimensions in place. Eyes form after the body,
 * then the smile follows; neither uses overshooting easing.
 */
export function introUniforms(t: number, from: Box, to: Box, radius: number, settleToCard = true): IntroUniforms {
  const morph = easeInOutCubic(progress(t, ...marks.morph));
  const chrome = easeOutCubic(progress(t, ...marks.chrome));
  const rise = easeOutCubic(progress(t, 700, 1150));
  const calm = progress(t, 1150, 2700);
  const liquid = rise * Math.max(0, 1 - calm) * (0.72 + 0.18 * dampedWobble(calm));
  const face = easeOutCubic(progress(t, ...marks.face));
  const smile = easeOutCubic(progress(t, ...marks.smile));
  const blinkP = progress(t, ...marks.blink);
  const blink = blinkP > 0 && blinkP < 1 ? Math.sin(Math.PI * blinkP) : 0;
  const settle = settleToCard ? easeInOutCubic(progress(t, marks.face[0] - 350, marks.handoff[0])) : 0;
  const alpha = t < marks.swapStart ? 0 : 1 - progress(t, ...marks.handoff);
  const breatheP = progress(t, 2100, 3300);
  const breathe = 1 + 0.012 * dampedWobble(breatheP, 1.5) * progress(t, 2050, 2200) * (1 - breatheP);
  return {
    center: [from.cx, from.cy],
    half: [lerp(from.hw, to.hw, morph) * breathe, lerp(from.hh, to.hh, morph) / breathe],
    radius, morph, liquid, chrome, face, smile, blink, settle, alpha,
  };
}