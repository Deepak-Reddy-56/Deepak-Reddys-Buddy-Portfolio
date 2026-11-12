/**
 * Motion helpers. Durations live in src/styles/tokens.css; this module reads
 * them at runtime so JS timers (e.g. waiting for the menu to finish closing)
 * always match the CSS, including the zeroed values under reduced motion.
 */
export type DurationToken =
  | '--dur-instant'
  | '--dur-fast'
  | '--dur-base'
  | '--dur-slow'
  | '--dur-menu-open'
  | '--dur-menu-close';

export function readDuration(token: DurationToken): number {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  if (!raw) return 0;
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return 0;
  return raw.endsWith('ms') ? value : value * 1000;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scrolls to an in-page section, respecting reduced motion. */
export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  history.replaceState(null, '', id === 'home' ? window.location.pathname : `#${id}`);
}
