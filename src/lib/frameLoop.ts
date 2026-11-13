/**
 * A requestAnimationFrame loop with an animation clock that:
 * - only advances while running and the tab is visible,
 * - caps per-frame delta so a stalled or hidden tab never skips ahead,
 * - cleans up after itself on dispose().
 */
import { debugFlag } from './debug';

export type TickCallback = (timeMs: number, deltaMs: number) => void;

const MAX_DELTA_MS = 1000 / 30;

/**
 * QA only (`?manualClock` in dev/QA builds): loops don't use rAF; a test drives
 * them with window.__frameStep(ms) for frame-exact recordings. Off in production.
 */
const manual = __DEBUG__ && debugFlag('manualClock');
const manualLoops = new Set<FrameLoop>();
if (manual) {
  (window as unknown as { __frameStep?: (ms: number) => void }).__frameStep = (ms) => manualLoops.forEach((loop) => loop.step(ms));
}

export class FrameLoop {
  private frame = 0;
  private running = false;
  private lastNow = 0;
  private elapsed = 0;
  private disposed = false;

  constructor(private readonly onTick: TickCallback) {
    document.addEventListener('visibilitychange', this.handleVisibility);
    if (manual) manualLoops.add(this);
  }

  get time(): number {
    return this.elapsed;
  }

  start(): void {
    if (this.disposed) return;
    this.running = true;
    if (!manual) this.schedule();
  }

  /** Advance by exactly `ms` (manual-clock QA mode). */
  step(ms: number): void {
    if (!this.running || this.disposed) return;
    this.elapsed += ms;
    this.onTick(this.elapsed, ms);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.lastNow = 0;
  }

  dispose(): void {
    this.stop();
    this.disposed = true;
    manualLoops.delete(this);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }

  private schedule(): void {
    if (!this.running || this.frame || document.hidden || this.disposed) return;
    this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (): void => {
    this.frame = 0;
    if (!this.running) return;
    // performance.now() keeps this clock on the same timebase as CSS transitions and timers.
    const now = performance.now();
    const delta = this.lastNow ? Math.min(now - this.lastNow, MAX_DELTA_MS) : 0;
    this.lastNow = now;
    this.elapsed += delta;
    this.onTick(this.elapsed, delta);
    this.schedule();
  };

  private handleVisibility = (): void => {
    if (document.hidden) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    } else {
      this.lastNow = 0; // resume without a jump
      this.schedule();
    }
  };
}
