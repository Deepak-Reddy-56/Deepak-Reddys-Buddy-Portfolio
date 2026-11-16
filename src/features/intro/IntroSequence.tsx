import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BuddyLine } from '../../content/buddyLines';
import { quips } from '../../content/buddyQuips';
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
import { buddyQuip } from '../buddy/buddyQuip';
import { line as buddyLine, pickLine, quipLine } from '../buddy/buddyScript';
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
/** Where Buddy stands (centre of the screen) while he introduces himself and Deepak. */
const INTRO_SLOT = '[data-intro-slot]';
/** His flight from the middle to his corner at the end of the intro. */
const FLY_MS = 1150;
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

/** Bio and stats come in as Buddy flies to his corner. */
function showDetails(show: boolean): void {
  if (show) document.documentElement.dataset.details = 'shown';
  else delete document.documentElement.dataset.details;
}

/** Centre the terminal on Buddy's intro spot, so the morph shrinks in place (no travel, no pop). */
function alignTerminalToIntroSlot(windowEl: HTMLDivElement | null): void {
  const slot = document.querySelector<HTMLElement>(INTRO_SLOT);
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

type Seat = { x: number; y: number; size: number };

function slotSeat(selector: string): Seat | null {
  const slot = document.querySelector<HTMLElement>(selector);
  if (!slot) return null;
  const r = slot.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: r.width };
}

/** His corner (top-right): where the director keeps him after the intro. */
const heroSeat = () => slotSeat(HERO_SLOT);
/** The middle of the screen, where he talks during the intro. */
const introSeat = () => slotSeat(INTRO_SLOT);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A gentle arc from the middle up to his corner. */
function flightPoint(from: Seat, to: Seat, u: number): Seat {
  const e = easeInOut(u);
  const cx = from.x + (to.x - from.x) * 0.35;
  const cy = Math.min(from.y, to.y) - Math.abs(to.y - from.y) * 0.25;
  const a = 1 - e;
  return {
    x: a * a * from.x + 2 * a * e * cx + e * e * to.x,
    y: a * a * from.y + 2 * a * e * cy + e * e * to.y,
    size: lerp(from.size, to.size, e),
  };
}

function terminalBox(windowEl: HTMLDivElement): MorphBox {
  const r = (windowEl.parentElement ?? windowEl).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height, radius: TERMINAL_RADIUS };
}

/** The canvas box Buddy occupies in his seat (body + padding), as a morph target. */
function seatBox(seat: Seat): MorphBox {
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
    view.setSpin(0);
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
  showDetails(true);
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
    showDetails(false);
    buddySpeech.set(null);
    buddyHost.view?.setConcealed(true);
    setIntroState('playing');
    const align = () => alignTerminalToIntroSlot(windowRef.current);
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
    /** E: his flight to the corner (wall-clock start, and where from / to). */
    let flight: { at: number; from: Seat; to: Seat } | null = null;
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
      buddySpeech.set(spoken.caption); // the caption under him, darkening word by word as he speaks
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
      if (finished.current) return;
      await wait(500);
      // E: he turns away and flies up to his corner; the bio and stats come in.
      const from = introSeat();
      const to = heroSeat();
      if (!from || !to) {
        finish('done');
        return;
      }
      expression = 'flying';
      showDetails(true);
      flight = { at: performance.now(), from, to };
      await wait(FLY_MS);
      // Settled in his corner, he says his line there (it darkens word by word as he speaks).
      activateHeroLine();
      expression = 'happy';
      await wait(250);
      if (finished.current) return;
      buddyQuip.say('hero', quips.settle.caption);
      await buddyVoice.playLine(quipLine(quips.settle));
      await wait(500);
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
      const seat = introSeat();
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
      } else if (flight) {
        // E: the flight — he turns his face away mid-air and back round as he lands.
        const u = Math.min(1, (now - flight.at) / FLY_MS);
        const target = heroSeat() ?? flight.to;
        const q = flightPoint(flight.from, target, u);
        view.setMorph(1, null);
        view.place(q.x, q.y, q.size);
        view.setSpin(Math.PI * 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.05)));
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
    buddyVoice.preload([...Object.values(lines), quipLine(quips.settle)]);
    soundEngine.play('enter');
    setTyped(COMMAND.length);
    // Reduced motion: no morph — Buddy is simply in his seat, beside the profile.
    if (reducedMotion) {
      finish('done');
      return;
    }
    goTo('running');
    alignTerminalToIntroSlot(windowRef.current);
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
