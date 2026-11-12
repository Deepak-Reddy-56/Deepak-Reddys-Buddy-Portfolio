/** Easing and interpolation helpers shared by JS-driven animation. */

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Normalised progress of `t` through the window [start, end]. */
export const progress = (t: number, start: number, end: number) => clamp((t - start) / (end - start));

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

/** Ease-out with a soft overshoot, like a damped spring settling (t ∈ [0,1]). */
export const easeOutBack = (t: number, overshoot = 1.2) => {
  const c3 = overshoot + 1;
  return 1 + c3 * (t - 1) ** 3 + overshoot * (t - 1) ** 2;
};

/** Damped oscillation: starts at 1, wobbles and decays to 0 (t ∈ [0,1]). */
export const dampedWobble = (t: number, cycles = 2.5) =>
  Math.exp(-4.5 * t) * Math.cos(t * cycles * Math.PI * 2);
