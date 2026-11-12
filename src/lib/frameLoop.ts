/**
 * A requestAnimationFrame loop with an animation clock that:
 * - only advances while running and the tab is visible,
 * - caps per-frame delta so a stalled or hidden tab never skips ahead,
 * - cleans up after itself on dispose().
 */
export type TickCallback = (timeMs: number, deltaMs: number) => void;

const MAX_DELTA_MS = 1000 / 30;

export class FrameLoop {
  private frame = 0;
  private running = false;
  private lastNow = 0;
  private elapsed = 0;
  private disposed = false;

  constructor(private readonly onTick: TickCallback) {
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  get time(): number {
    return this.elapsed;
  }

  start(): void {
    if (this.disposed) return;
    this.running = true;
    this.schedule();
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
