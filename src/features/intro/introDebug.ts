/**
 * Intro timing probe — development / QA builds only (removed from production
 * by dead-code elimination). Enable with `?introDebug` on `npm run dev`, or a
 * build made with VITE_INTRO_DEBUG=1.
 *
 * Records real frame intervals while the sequence runs and reports frame-time
 * percentiles (p50/p95/p99, worst), frames over 16.7 ms and 33.3 ms, the
 * display refresh rate, the WebGL renderer (GPU vs software), and wall-clock
 * duration versus the designed timeline. Judge smoothness by p95/p99 and the
 * over-budget counts, not by average fps.
 */
export const introDebugEnabled =
  __DEBUG__ &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('introDebug');

export type IntroTimingReport = {
  /** WebGL renderer string (e.g. a GPU name, or SwiftShader = software). */
  renderer: string;
  /** Display refresh rate estimated from idle rAF before the run. */
  refreshHz: number;
  frames: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  worstMs: number;
  /** Timeline position (ms after Run) at the end of the worst frame. */
  worstAtMs: number;
  over16_7ms: number;
  over33_3ms: number;
  wallMs: number;
  timelineMs: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function webglRenderer(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) return 'none';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return String(name);
  } catch {
    return 'unknown';
  }
}

/** Idle rAF cadence → refresh rate. Sampled once, while nothing heavy is drawing. */
let refreshHz = 0;
if (introDebugEnabled) {
  const samples: number[] = [];
  let prev = 0;
  const sample = (now: number) => {
    if (prev) samples.push(now - prev);
    prev = now;
    if (samples.length < 60) requestAnimationFrame(sample);
    else refreshHz = Math.round(1000 / percentile([...samples].sort((a, b) => a - b), 50));
  };
  requestAnimationFrame(sample);
}

export function createTimingProbe() {
  const intervals: number[] = [];
  const at: number[] = [];
  let last = 0;
  let first = 0;

  return {
    frame(timelineMs: number) {
      const now = performance.now();
      if (!first) first = now;
      if (last) {
        intervals.push(now - last);
        at.push(timelineMs);
      }
      last = now;
      return timelineMs;
    },
    report(timelineMs: number): IntroTimingReport {
      const sorted = [...intervals].sort((a, b) => a - b);
      const result: IntroTimingReport = {
        renderer: webglRenderer(),
        refreshHz,
        frames: intervals.length + 1,
        p50Ms: round1(percentile(sorted, 50)),
        p95Ms: round1(percentile(sorted, 95)),
        p99Ms: round1(percentile(sorted, 99)),
        worstMs: round1(sorted[sorted.length - 1] ?? 0),
        worstAtMs: Math.round(at[intervals.indexOf(Math.max(0, ...intervals))] ?? 0),
        over16_7ms: intervals.filter((ms) => ms > 16.7).length,
        over33_3ms: intervals.filter((ms) => ms > 33.3).length,
        wallMs: Math.round(last - first),
        timelineMs: Math.round(timelineMs),
      };
      (window as unknown as { __introTiming?: IntroTimingReport }).__introTiming = result;
      console.info('[intro timing]', result);
      showReport(result);
      return result;
    },
  };
}

function showReport(report: IntroTimingReport): void {
  const el = document.createElement('pre');
  el.textContent = Object.entries(report)
    .map(([key, value]) => `${key.padEnd(13)} ${value}`)
    .join('\n');
  Object.assign(el.style, {
    position: 'fixed',
    zIndex: '200',
    left: '12px',
    bottom: '12px',
    margin: '0',
    padding: '10px 12px',
    borderRadius: '10px',
    background: 'rgba(17,17,17,0.86)',
    color: '#fff',
    font: '11px/1.5 ui-monospace, monospace',
    pointerEvents: 'none',
  });
  document.body.appendChild(el);
}
