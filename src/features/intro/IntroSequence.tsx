import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { seatExpressions, spokenIntro } from '../../content/dialogue';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { soundEngine } from '../../lib/audio/soundEngine';
import { lerp } from '../../lib/easing';
import { FrameLoop } from '../../lib/frameLoop';
import { buddyVoice } from '../../lib/voice/voice';
import { buddyGeometry } from '../buddy/buddyGeometry';
import { buddyHost } from '../buddy/buddyHost';
import type { MorphBox, PaperBuddyView } from '../buddy/PaperBuddyView';
import { IntroControls } from './IntroControls';
import { COMMAND, TerminalScene } from './TerminalScene';
import { morph, morphAt, READY_LIMIT_MS } from './terminalMorph';
import type { IntroEnd } from './useIntroGate';
import styles from './Intro.module.css';

type Step = 'typing' | 'ready' | 'running' | 'leaving';

type IntroSequenceProps = {
  soundEnabled: boolean;
  soundSupported: boolean;
  onSound: (on: boolean) => void;
  onFinish: (reason: IntroEnd) => void;
};

const TERMINAL_RADIUS = 22;
const HERO_SEAT = '[data-buddy-seat="hero"]';
const HERO_SLOT = HERO_SEAT + ' [data-buddy-slot]';
/** Buddy's canvas is the padded mask; his body is this fraction of its width. */
const BODY_FRACTION = buddyGeometry.body.width / buddyGeometry.width;
const CANVAS_ASPECT = buddyGeometry.height / buddyGeometry.width;

function setIntroState(value: 'playing' | 'leaving' | null): void {
  const root = document.documentElement;
  if (value) root.dataset.intro = value;
  else delete root.dataset.intro;
}

/** Centre the terminal on Buddy's hero seat, so the morph shrinks in place (no travel, no pop). */
function alignTerminalToHeroSlot(windowEl: HTMLDivElement | null): void {
  const slot = document.querySelector<HTMLElement>(HERO_SLOT);
  const scene = windowEl?.parentElement;
  if (!windowEl || !slot || !scene) return;
  scene.style.setProperty('--terminal-align-x', '0px');
  scene.style.setProperty('--terminal-align-y', '0px');
  const terminal = windowEl.getBoundingClientRect();
  const hero = slot.getBoundingClientRect();
  scene.style.setProperty('--terminal-align-x', hero.left + hero.width / 2 - (terminal.left + terminal.width / 2) + 'px');
  scene.style.setProperty('--terminal-align-y', hero.top + hero.height / 2 - (terminal.top + terminal.height / 2) + 'px');
}

function heroSeat(): { x: number; y: number; size: number } | null {
  const slot = document.querySelector<HTMLElement>(HERO_SLOT);
  if (!slot) return null;
  const r = slot.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
}

/** The canvas box Buddy occupies in his seat (body + padding), as a morph target. */
function seatBox(seat: { x: number; y: number; size: number }): MorphBox {
  const w = seat.size / BODY_FRACTION;
  return { x: seat.x, y: seat.y, w, h: w * CANVAS_ASPECT, radius: 0 };
}

function activateHeroLine(): void {
  document.querySelector(HERO_SEAT)?.setAttribute('data-buddy-active', '');
}

/** Put the one Buddy exactly where the director will keep him, fully formed and small. */
function settleImmediately(view: PaperBuddyView | null): void {
  if (view) {
    view.setMorph(1, null);
    view.setFaceReveal(1);
    view.lookAt(0, 0, true);
    view.model.setBlink(0);
    view.model.setExpression(seatExpressions.hero ?? 'idle');
    const seat = heroSeat();
    if (seat) view.place(seat.x, seat.y, seat.size);
  }
  activateHeroLine();
}

/**
 * The introduction:
 *   A  a glossy chrome terminal types its start command; the visitor presses Enter
 *   B  the commands load for a moment
 *   C  the terminal itself becomes Buddy — the same chrome surface shrinks into his
 *      small seat, rounding into his silhouette only once he is small
 *   D  his eyes and smile appear; he looks around and blinks
 *   E  the page appears around him and the director takes over where he already is
 */
export function IntroSequence({ soundEnabled, soundSupported, onSound, onFinish }: IntroSequenceProps) {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('typing');
  const [typed, setTyped] = useState(0);
  const [outputLines, setOutputLines] = useState(0);
  const [handedOff, setHandedOff] = useState(false);
  const [fallbackExit, setFallbackExit] = useState(false);
  const [touch] = useState(() => window.matchMedia('(hover: none)').matches);

  const overlayRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLButtonElement>(null);
  const loopRef = useRef<FrameLoop | null>(null);
  const stepRef = useRef<Step>('typing');
  const runId = useRef(`intro-${Math.random().toString(36).slice(2)}`);
  const finished = useRef(false);

  const goTo = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const finish = useCallback(
    (reason: IntroEnd) => {
      if (finished.current) return;
      finished.current = true;
      if (reason === 'skip') buddyVoice.cancel();
      loopRef.current?.dispose();
      loopRef.current = null;
      settleImmediately(buddyHost.view);
      setIntroState(null);
      onFinish(reason);
    },
    [onFinish],
  );
  const skip = useCallback(() => finish('skip'), [finish]);

  // Before first paint: own the screen and align the terminal to the hero seat.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelectorAll('[data-buddy-active]').forEach((seat) => seat.removeAttribute('data-buddy-active'));
    setIntroState('playing');
    const align = () => alignTerminalToHeroSlot(windowRef.current);
    align();
    window.addEventListener('resize', align, { passive: true });
    void document.fonts?.ready.then(align);
    return () => {
      window.removeEventListener('resize', align);
      setIntroState(null);
    };
  }, []);

  useEffect(() => () => loopRef.current?.dispose(), []);

  // The command types itself.
  useEffect(() => {
    if (step !== 'typing') return;
    if (reducedMotion) {
      setTyped(COMMAND.length);
      goTo('ready');
      return;
    }
    if (typed >= COMMAND.length) {
      goTo('ready');
      return;
    }
    const delay = typed === 0 ? 900 : 48 + Math.random() * 46;
    const timer = window.setTimeout(() => {
      setTyped((count) => count + 1);
      soundEngine.play('key');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [step, typed, reducedMotion, goTo]);

  const run = useCallback(() => {
    const current = stepRef.current;
    if (current !== 'typing' && current !== 'ready') return;
    soundEngine.unlock();
    buddyVoice.prime();
    soundEngine.play('enter');
    setTyped(COMMAND.length);

    // Reduced motion: no morph — Buddy is simply in his seat.
    if (reducedMotion) {
      finish('done');
      return;
    }
    goTo('running');
    alignTerminalToHeroSlot(windowRef.current);

    let swappedAt: number | null = null;
    const fired = new Set<string>();
    const once = (key: string, condition: boolean, action: () => void) => {
      if (condition && !fired.has(key)) {
        fired.add(key);
        action();
      }
    };
    /** No live Buddy: the terminal recedes and the page appears. Never a stand-in. */
    const recede = () => {
      loopRef.current?.dispose();
      loopRef.current = null;
      setFallbackExit(true);
      window.setTimeout(() => finish('done'), 420);
    };

    const loop = new FrameLoop((t, dtMs) => {
      if (finished.current) return;
      once('line1', t >= morph.line1, () => setOutputLines(1));
      once('line2', t >= morph.line2, () => setOutputLines(2));

      const view = buddyHost.view;
      const status = buddyHost.status;
      const windowEl = windowRef.current;

      // B: the commands "load" until the swap time and until Buddy is live.
      if (swappedAt === null) {
        if (status === 'unavailable' || t > READY_LIMIT_MS) {
          recede();
          return;
        }
        if (t < morph.swap || status !== 'live' || !view || !windowEl) return;
        swappedAt = t;
      }
      // From here on Buddy must stay live; otherwise reveal the page rather than leave a blank intro.
      if (status !== 'live' || !view || !windowEl) {
        loopRef.current?.dispose();
        loopRef.current = null;
        finish('done');
        return;
      }

      // Timeline time, anchored so a late swap (slow GPU start) still plays the whole morph.
      const e = morph.swap + (t - swappedAt);
      const f = morphAt(e);
      const r = windowEl.getBoundingClientRect();
      const from: MorphBox = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, radius: TERMINAL_RADIUS };
      const seat = heroSeat();
      const to = seat ? seatBox(seat) : from;
      const w = lerp(from.w, to.w, f.shrink);
      const h = lerp(from.h, to.h, f.shrink);
      const box: MorphBox = {
        x: lerp(from.x, to.x, f.shrink),
        y: lerp(from.y, to.y, f.shrink),
        w,
        h,
        radius: lerp(TERMINAL_RADIUS, Math.min(w, h) / 2, f.form),
      };

      once('swap', true, () => {
        setHandedOff(true);
        soundEngine.play('startup');
      });

      if (f.form < 1) {
        view.setMorph(f.form, box);
      } else if (seat) {
        view.setMorph(1, null);
        view.place(seat.x, seat.y, seat.size);
      }
      view.setFaceReveal(f.face);
      view.model.setExpression(f.curious ? 'curious' : (seatExpressions.hero ?? 'idle'));
      view.lookAt(f.lookX, f.lookY);
      view.model.setBlink(f.blink);
      view.tickFace(Math.max(dtMs, 1) / 1000);

      once('blip', e >= morph.face[0] + 80, () => soundEngine.play('blip'));
      once('speak', e >= morph.face[1] - 120, () => buddyVoice.sayOnce(runId.current, spokenIntro));
      once('landed', f.form >= 1, activateHeroLine);
      once('reveal', e >= morph.revealPage, () => {
        goTo('leaving');
        setIntroState('leaving');
      });
      if (e >= morph.done) finish('done');
    });
    loopRef.current = loop;
    loop.start();
  }, [reducedMotion, finish, goTo]);

  // Enter runs from anywhere (buttons keep their own Enter behaviour).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      if (event.target instanceof HTMLButtonElement && !event.target.hasAttribute('data-enter-runs')) return;
      event.preventDefault();
      run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  // Focus the dialog itself (not Run) so no focus ring flashes on load; Enter still runs.
  useFocusTrap(overlayRef, true, { initialFocus: overlayRef, onEscape: skip });

  const running = step === 'running' || step === 'leaving';

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      data-step={step}
      role="dialog"
      aria-modal="true"
      aria-label="Introduction"
      tabIndex={-1}
    >
      <div className={styles.backdrop} aria-hidden="true" />
      <TerminalScene
        typed={typed}
        outputLines={outputLines}
        ready={step === 'ready'}
        running={running}
        handedOff={handedOff}
        fallbackExit={fallbackExit}
        touch={touch}
        onRun={run}
        windowRef={windowRef}
        runRef={runRef}
      />
      <div className={styles.controls}>
        <IntroControls soundEnabled={soundEnabled} soundSupported={soundSupported} onSound={onSound} onSkip={skip} />
      </div>
    </div>
  );
}
