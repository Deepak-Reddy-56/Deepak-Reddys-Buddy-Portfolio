import { dampedWobble, easeInOutCubic, easeOutBack, easeOutCubic, lerp, progress } from '../../lib/easing';

/**
 * The single clock for the introduction, in ms after the visitor runs the
 * command. DOM moments (text out, overlay fade, hand-off) and shader uniforms
 * both read these marks, so nothing drifts out of sync.
 */
export const marks = {
  outputEnd: 620, // terminal prints its two output lines
  swapStart: 560, // shader box appears under the DOM terminal
  swapEnd: 780, // DOM terminal fully gone; the shader carries on
  chrome: [700, 1450],
  morph: [820, 1800],
  move: [1000, 2350],
  drops: [900, 2150],
  face: [2250, 2700],
  revealPage: [2350, 3050], // white overlay fades, homepage emerges around Buddy
  blink: [3050, 3210],
  handoff: [3260, 3520], // shader → DOM placeholder crossfade
  done: 3560,
} as const;

export type Box = { cx: number; cy: number; hw: number; hh: number };

export type IntroUniforms = {
  center: [number, number];
  half: [number, number];
  radius: number;
  morph: number;
  liquid: number;
  drops: number;
  chrome: number;
  face: number;
  blink: number;
  settle: number;
  alpha: number;
};

export function boxFromRect(rect: DOMRect): Box {
  return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, hw: rect.width / 2, hh: rect.height / 2 };
}

export function introUniforms(t: number, from: Box, to: Box, radius: number): IntroUniforms {
  const move = easeInOutCubic(progress(t, ...marks.move));
  const size = easeOutBack(progress(t, ...marks.move), 0.9);
  const morph = easeInOutCubic(progress(t, ...marks.morph));
  const chrome = easeOutCubic(progress(t, ...marks.chrome));

  // Agitation rises as the glass turns to metal, then settles with a wobble.
  const rise = easeOutCubic(progress(t, 700, 1150));
  const calm = progress(t, 1150, 2700);
  const liquid = rise * Math.max(0, 1 - calm) * (0.75 + 0.25 * dampedWobble(calm));

  const dropsP = progress(t, ...marks.drops);
  const drops = Math.sin(Math.PI * dropsP) ** 1.5;

  const face = easeOutBack(progress(t, ...marks.face), 1.6);
  const blinkP = progress(t, ...marks.blink);
  const blink = blinkP > 0 && blinkP < 1 ? Math.sin(Math.PI * blinkP) : 0;

  const settle = easeInOutCubic(progress(t, marks.face[0] - 350, marks.handoff[0]));
  // Invisible until the shader takes over the terminal's box; fades out at the hand-off.
  const alpha = t < marks.swapStart ? 0 : 1 - progress(t, ...marks.handoff);

  // A gentle "breath" in the pebble while it settles.
  const breatheP = progress(t, 2000, 3200);
  const breathe = 1 + 0.035 * dampedWobble(breatheP, 1.5) * progress(t, 1900, 2100) * (1 - breatheP);

  return {
    center: [lerp(from.cx, to.cx, move), lerp(from.cy, to.cy, move)],
    half: [lerp(from.hw, to.hw, size) * breathe, lerp(from.hh, to.hh, size) / breathe],
    radius,
    morph,
    liquid,
    drops,
    chrome,
    face,
    blink,
    settle,
    alpha,
  };
}
