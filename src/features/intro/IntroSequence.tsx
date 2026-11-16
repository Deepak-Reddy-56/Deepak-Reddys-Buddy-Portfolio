import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BuddyLine } from '../../content/buddyLines';
import { seatExpressions } from '../../content/dialogue';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { soundEngine } from '../../lib/audio/soundEngine';
import { lerp } from '../../lib/easing';
import { FrameLoop } from '../../lib/frameLoop';
import { buddyVoice, spokenAt } from '../../lib/voice/voice';
import type { ExpressionName } from '../buddy/expressions';
import { buddyGeometry } from '../buddy/buddyGeometry';
import { buddyHost } from '../buddy/buddyHost';
import { line as buddyLine, pickLine } from '../buddy/buddyScript';
import { buddySpeech } from '../buddy/buddySpeech';
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

const TERMINAL_RADIUS = 46;
/** Deepak's profile parts Buddy looks at while introducing him. */
const PROFILE_PARTS = { photo: '[data-profile-part="photo"]', tag: '[data-profile-part="tag"]' } as const;
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

function showProfile(show: boolean): void {
  if (show) document.documentElement.dataset.profile = 'shown';
  else delete document.documentElement.dataset.profile;
}

/** Centre the terminal on Buddy's hero seat, so the morph shrinks in place (no travel, no pop). */
function alignTerminalToHeroSlot(windowEl: HTMLDivElement | null): void {
  const slot = document.querySelector<HTMLElement>(HERO_SLOT);
  const scene = windowEl?.parentElement;
  if (!windowEl || !slot || !scene) return;
  scene.style.setProperty('--terminal-align-x', '0px');
  scene.style.setProperty('--terminal-align-y', '0px');
  // The scene box is stable; the window inside it plays a short entrance animation.
  const terminal = scene.getBoundingClientRect();
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

function terminalBox(windowEl: HTMLDivElement): MorphBox {
  const r = (windowEl.parentElement ?? windowEl).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, radius: TERMINAL_RADIUS };
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
    view.setConcealed(false);
  }
  activateHeroLine();
  showProfile(true);
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * The introduction:
 *   A  a glossy chrome terminal (Buddy's own Liquid Metal surface) types its command;
 *      the visitor presses Enter
 *   B  the commands load for a moment
 *   C  the terminal itself becomes Buddy: it shrinks while still a slab and rounds into
 *      his small silhouette — then his eyes and smile appear and he looks around
 *   D  he introduces himself (with a joke), then Deepak — the profile pops up — (another joke)
 *   E  the director takes over exactly where he is
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
  const stepRef = useRef<Step>('typing');
  const runAt = useRef<number | null>(null);
  const finished = useRef(false);

  const goTo = useCallback((next: Step) => {
    stepRef.current = next;
    setStep(next);
  }, []);

  const finish = useCallback(
    (reason: IntroEnd) => {
      if (finished.current) return;
      finished.current = true;
      buddyVoice.cancel();
      buddySpeech.set(null);
      settleImmediately(buddyHost.view);
      setIntroState(null);
      onFinish(reason);
    },
    [onFinish],
  );
  const skip = useCallback(() => finish('skip'), [finish]);

  // Before first paint: own the screen, hide the page's Buddy, align the terminal to the hero seat.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelectorAll('[data-buddy-active]').forEach((seat) => seat.removeAttribute('data-buddy-active'));
    showProfile(false);
    buddySpeech.set(null);
    buddyHost.view?.setConcealed(true);
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

  // The lines for this visit (jokes are picked fresh, never the last one heard).
  const [lines] = useState(() => ({
    hey: buddyLine('hey'),
    selfJoke: pickLine('self'),
    deepak: buddyLine('deepak'),
    deepakJoke: pickLine('deepak'),
  }));

  // One loop for the whole intro: Buddy is the terminal's surface from the start.
  useEffect(() => {
    let swappedAt: number | null = null;
    let scriptStarted = false;
    let expression: ExpressionName = 'idle';
    /** What he looks at while talking: the visitor (null), or Deepak's photo / name tag. */
    let lookTarget: 'photo' | 'tag' | null = null;
    const fired = new Set<string>();
    const once = (key: string, condition: boolean, action: () => void) => {
      if (condition && !fired.has(key)) {
        fired.add(key);
        action();
      }
    };
    const recede = () => {
      loop.dispose();
      setFallbackExit(true);
      window.setTimeout(() => finish('done'), 420);
    };

    // D: Buddy's introduction — himself and a joke about himself; then Deepak
    // (the greyed profile pops up as he turns to it) and a joke about Deepak.
    // The jokes are picked per visit from a pool (see scripts/buddy-lines.json).
    const say = async (spoken: BuddyLine) => {
      if (finished.current) return;
      buddySpeech.set(spoken.caption);
      activateHeroLine(); // his caption appears as he starts talking
      await buddyVoice.playLine(spoken);
    };
    const script = async () => {
      expression = 'greeting';
      await say(lines.hey);
      await wait(450);
      expression = 'happy';
      await say(lines.selfJoke);
      if (finished.current) return;
      await wait(600);
      // He turns to Deepak's photo — the profile pops up — then reads the name tag.
      expression = 'curious';
      lookTarget = 'photo';
      await wait(350);
      showProfile(true);
      await wait(500);
      const naming = say(lines.deepak);
      await wait(spokenAt(lines.deepak, 0.5)); // as he reaches "He built me"
      lookTarget = 'tag';
      await naming;
      await wait(350);
      lookTarget = null;
      expression = 'happy';
      await wait(400);
      await say(lines.deepakJoke);
      await wait(700);
      finish('done');
    };

    const loop = new FrameLoop((_t, dtMs) => {
      if (finished.current) return;
      const now = performance.now();
      const view = buddyHost.view;
      const status = buddyHost.status;
      const windowEl = windowRef.current;
      const dt = Math.max(dtMs, 1) / 1000;
      const talk = buddyVoice.talk(now);

      // A: before Run — the live Buddy is the terminal's chrome surface.
      if (runAt.current === null) {
        if (!view || !windowEl) return;
        if (status !== 'live') {
          view.setConcealed(true);
          return;
        }
        view.setMorph(0, terminalBox(windowEl));
        view.setFaceReveal(0);
        view.setConcealed(false);
        view.tickFace(dt, 0);
        return;
      }

      const r = now - runAt.current;
      once('line1', r >= morph.line1, () => setOutputLines(1));
      once('line2', r >= morph.line2, () => setOutputLines(2));

      // B: the commands load until the swap time and until Buddy is live.
      if (swappedAt === null) {
        if (status === 'unavailable' || r > READY_LIMIT_MS) {
          recede();
          return;
        }
        if (view && windowEl && status === 'live') {
          view.setMorph(0, terminalBox(windowEl));
          view.setConcealed(false);
          view.tickFace(dt, 0);
        }
        if (r < morph.swap || status !== 'live' || !view || !windowEl) return;
        swappedAt = r;
      }
      // From here on Buddy must stay live; otherwise reveal the page rather than leave a blank intro.
      if (status !== 'live' || !view || !windowEl) {
        loop.dispose();
        finish('done');
        return;
      }

      // C: the terminal becomes Buddy.
      const e = morph.swap + (r - swappedAt);
      const f = morphAt(e);
      const from = terminalBox(windowEl);
      const seat = heroSeat();
      const to = seat ? seatBox(seat) : from;
      const w = lerp(from.w, to.w, f.shrink);
      const h = lerp(from.h, to.h, f.shrink);
      once('swap', true, () => {
        setHandedOff(true);
        soundEngine.play('startup');
      });
      if (f.form < 1) {
        view.setMorph(f.form, {
          x: lerp(from.x, to.x, f.shrink),
          y: lerp(from.y, to.y, f.shrink),
          w,
          h,
          radius: lerp(TERMINAL_RADIUS, Math.min(w, h) / 2, f.form),
        });
      } else if (seat) {
        view.setMorph(1, null);
        view.place(seat.x, seat.y, seat.size);
      }
      view.setFaceReveal(f.face);
      once('blip', e >= morph.face[0] + 80, () => soundEngine.play('blip'));
      once('reveal', e >= morph.revealPage, () => {
        goTo('leaving');
        setIntroState('leaving');
      });

      if (e < morph.done) {
        view.model.setExpression(f.curious ? 'curious' : 'idle');
        view.lookAt(f.lookX, f.lookY);
        view.model.setBlink(f.blink);
      } else {
        once('script', !scriptStarted, () => {
          scriptStarted = true;
          void script();
        });
        view.model.setExpression(expression);
        const target = lookTarget ? document.querySelector<HTMLElement>(PROFILE_PARTS[lookTarget]) : null;
        if (target) {
          const t = target.getBoundingClientRect();
          view.lookToward(t.left + t.width / 2, t.top + t.height / 2);
        } else {
          view.lookAt(0, 0);
        }
        view.model.setBlink(0);
      }
      view.tickFace(dt, talk);
    });
    loop.start();
    return () => loop.dispose();
  }, [finish, goTo, lines]);

  const run = useCallback(() => {
    const current = stepRef.current;
    if (current !== 'typing' && current !== 'ready') return;
    soundEngine.unlock();
    buddyVoice.prime();
    buddyVoice.preload(Object.values(lines));
    soundEngine.play('enter');
    setTyped(COMMAND.length);
    // Reduced motion: no morph — Buddy is simply in his seat, beside the profile.
    if (reducedMotion) {
      finish('done');
      return;
    }
    goTo('running');
    alignTerminalToHeroSlot(windowRef.current);
    runAt.current = performance.now();
  }, [reducedMotion, finish, goTo, lines]);

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
    <>
      {/* The white field sits beneath Buddy; the terminal's text and controls sit above him. */}
      <div className={styles.backdrop} data-step={step} aria-hidden="true" />
      <div
        ref={overlayRef}
        className={styles.overlay}
        data-step={step}
        role="dialog"
        aria-modal="true"
        aria-label="Introduction"
        tabIndex={-1}
      >
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
    </>
  );
}
