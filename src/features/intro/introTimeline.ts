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
  morph: [820, 1920], // reshape and resize the terminal into a chrome pebble at its own centre
  face: [1930, 2450], // the face forms on the transformed terminal while it remains in place
  drops: [900, 2150],
  revealPage: [2350, 3150], // reveal the page as the formed Buddy makes its short flight
  blink: [2600, 2760],
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

/**
 * `settleToCard`: end as an exact image of the CSS placeholder (static fallback).
 * When the 3D Buddy takes over instead, stay liquid chrome on his ellipsoid silhouette.
 * The hero seat is aligned to this terminal centre before the animation starts.
 */
export function introUniforms(t: number, from: Box, to: Box, radius: number, settleToCard = true): IntroUniforms {
  // The terminal itself becomes Buddy at its source coordinates; it does not fly away.
  const form = easeInOutCubic(progress(t, ...marks.morph));
  const morph = form;
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

  const settle = settleToCard ? easeInOutCubic(progress(t, marks.face[0] - 350, marks.handoff[0])) : 0;
  // Invisible until the shader takes over the terminal's box; fades out at the hand-off.
  const alpha = t < marks.swapStart ? 0 : 1 - progress(t, ...marks.handoff);

  // A gentle "breath" in the pebble while it settles.
  const breatheP = progress(t, 2000, 3200);
  const breathe = 1 + 0.035 * dampedWobble(breatheP, 1.5) * progress(t, 1900, 2100) * (1 - breatheP);

  return {
    // Keep the transforming object at the terminal's exact centre throughout.
    center: [from.cx, from.cy],
    half: [lerp(from.hw, to.hw, form) * breathe, lerp(from.hh, to.hh, form) / breathe],
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
