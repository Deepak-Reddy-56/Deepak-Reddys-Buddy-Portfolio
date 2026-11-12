import { useEffect } from 'react';

/**
 * Writes page scroll progress (0–1) to the `--scroll-progress` custom property
 * on <html>, at most once per animation frame. Nothing re-renders: components
 * read the value from CSS.
 */
export function useScrollProgress(): void {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;

    const write = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      root.style.setProperty('--scroll-progress', progress.toFixed(4));
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    // Content height can change without a scroll (fonts, images).
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
    };
  }, []);
}
