import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { soundEngine } from '../../lib/audio/soundEngine';
import { buddyVoice } from '../../lib/voice/voice';
import { spokenIntro } from '../../content/dialogue';
import { FrameLoop } from '../../lib/frameLoop';
import type { ShaderStage } from '../../lib/webgl/ShaderStage';
import { createTimingProbe, introDebugEnabled } from './introDebug';
import { IntroControls } from './IntroControls';
import { boxFromRect, introUniforms, marks, type Box } from './introTimeline';
import { LiquidScene } from './LiquidScene';
import { COMMAND, TerminalScene } from './TerminalScene';
import type { IntroEnd } from './useIntroGate';
import styles from './Intro.module.css';

type Step = 'typing' | 'ready' | 'running' | 'leaving';

type IntroSequenceProps = {
  soundEnabled: boolean;
  soundSupported: boolean;
  onSound: (on: boolean) => void;
  onFinish: (reason: IntroEnd) => void;
  onPrepareHandoff: () => void;
  buddyReady: boolean;
};

const TERMINAL_RADIUS = 22;
const HERO_SLOT = '[data-buddy-seat="hero"] [data-buddy-slot]';

function alignTerminalToHeroSlot(windowEl: HTMLDivElement | null): void {
  const slot = document.querySelector<HTMLElement>(HERO_SLOT);
  const scene = windowEl?.parentElement;
  if (!windowEl || !slot || !scene) return;
  scene.style.setProperty('--terminal-align-x', '0px');
  scene.style.setProperty('--terminal-align-y', '0px');
  const terminal = windowEl.getBoundingClientRect();
  const hero = slot.getBoundingClientRect();
  const terminalX = terminal.left + terminal.width / 2;
  const terminalY = terminal.top + terminal.height / 2;
  const heroX = hero.left + hero.width / 2;
  const heroY = hero.top + hero.height / 2;
  scene.style.setProperty('--terminal-align-x', (heroX - terminalX) + 'px');
  scene.style.setProperty('--terminal-align-y', (heroY - terminalY) + 'px');
}
function setIntroState(value: 'playing' | 'leaving' | 'handoff' | null): void {
  const root = document.documentElement;
  if (value) root.dataset.intro = value;
  else delete root.dataset.intro;
}

/**
 * The introduction, as one clock:
 *   A  terminal types → visitor runs it
 *   B  the window itself turns to liquid chrome (same box, now in the shader)
 *   C  the liquid settles into Buddy, exactly where the homepage keeps him,
 *      while the page fades up around him; then the DOM Buddy takes over.
 */
export function IntroSequence({ soundEnabled, soundSupported, onSound, onFinish, onPrepareHandoff, buddyReady }: IntroSequenceProps) {
  const reducedMotion = useReducedMotion();
  const [step, setStep] = useState<Step>('typing');
  const [typed, setTyped] = useState(0);
  const [outputLines, setOutputLines] = useState(0);
  const [handedOff, setHandedOff] = useState(false);
  // Let the actual fragment shader prove it compiled and warmed successfully.
  const [webgl, setWebgl] = useState(true);
  const [shaderReady, setShaderReady] = useState(false);
  const [shaderTransition, setShaderTransition] = useState(false);
  const [shaderError, setShaderError] = useState<string | null>(null);
  const [touch] = useState(() => window.matchMedia('(hover: none)').matches);

  const overlayRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<ShaderStage | null>(null);
  const loopRef = useRef<FrameLoop | null>(null);
  const stepRef = useRef<Step>('typing');
  const runId = useRef(`intro-${Math.random().toString(36).slice(2)}`);
  const finished = useRef(false);
  const pendingRun = useRef(false);
  const runAction = useRef<() => void>(() => {});
  const buddyReadyRef = useRef(buddyReady);
  buddyReadyRef.current = buddyReady;

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
      setIntroState(null);
      onFinish(reason);
    },
    [onFinish],
  );

  const skip = useCallback(() => finish('skip'), [finish]);
  const markShaderReady = useCallback(() => setShaderReady(true), []);
  const markUnavailable = useCallback((reason = 'Unknown Liquid Chrome initialization error.') => {
    console.error('[intro] Liquid Chrome shader unavailable:', reason);
    setShaderError(reason);
    setWebgl(false);
    setShaderReady(false);
    setShaderTransition(false);
    if (stepRef.current === 'running' || stepRef.current === 'leaving') {
      loopRef.current?.dispose();
      loopRef.current = null;
      setHandedOff(false);
      goTo('ready');
      setIntroState('playing');
    }
  }, [goTo]);

  // Align the terminal to Buddy's final hero seat before the first paint.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
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

  // Scene A: the command types itself.
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

    // Do not start the fallback timeline while the real shader is compiling.
    // Queue the visitor's Enter/click and replay it after the ready/failure result.
    if (webgl && (!shaderReady || stageRef.current === null)) {
      pendingRun.current = true;
      return;
    }
    if (!webgl) return;
    pendingRun.current = false;
    soundEngine.unlock();
    buddyVoice.prime();
    soundEngine.play('enter');
    setTyped(COMMAND.length);

    // Run is an explicit user action: keep the shape morph even when the OS
    // requests reduced motion, but remove surface wobble, breathing and blink.
    goTo('running');

    const windowEl = windowRef.current;
    alignTerminalToHeroSlot(windowEl);
    const slot = document.querySelector<HTMLElement>(HERO_SLOT);
    const stage = stageRef.current;
    const useShader = webgl && shaderReady && stage !== null && windowEl !== null && slot !== null;
    if (!useShader) {
      setShaderError('The morph stage or its measured terminal/hero geometry is missing. The terminal has been kept visible.');
      goTo('ready');
      setIntroState('playing');
      return;
    }
    setShaderTransition(true);

    let from: Box | null = windowEl ? boxFromRect(windowEl.getBoundingClientRect()) : null;
    let to: Box | null = slot ? boxFromRect(slot.getBoundingClientRect()) : null;
    const onResize = () => {
      alignTerminalToHeroSlot(windowEl);
      if (windowEl) from = boxFromRect(windowEl.getBoundingClientRect());
      if (slot) to = boxFromRect(slot.getBoundingClientRect());
    };
    window.addEventListener('resize', onResize);

    const m = marks;
    // Hand-off target: the 3D Buddy (if it has loaded) or the static placeholder.
    const toThreeD = document.documentElement.dataset.buddy === '3d';
    const fired = new Set<string>();
    const once = (key: string, condition: boolean, action: () => void) => {
      if (condition && !fired.has(key)) {
        fired.add(key);
        action();
      }
    };

    const probe = introDebugEnabled ? createTimingProbe() : null;
    let shaderFrameVisible = false;
    let handoffStartedAt: number | null = null;
    const handoffDuration = m.handoff[1] - m.handoff[0];

    const loop = new FrameLoop((t) => {
      probe?.frame(t);
      once('line1', t >= 120, () => setOutputLines(1));
      once('line2', t >= 400, () => setOutputLines(2));
      once('startup', t >= (useShader ? marks.chrome[0] : 300), () => soundEngine.play('startup'));
      once('swap', t >= m.swapStart, () => setHandedOff(true));
      once('reveal', t >= m.revealPage[0], () => {
        // Start the real page Buddy while the finished shader Buddy is still visible.
        onPrepareHandoff();
        goTo('leaving');
        setIntroState('leaving');
      });

      // Keep the finished liquid Buddy fully opaque until the replacement has
      // mounted its Three.js face and Paper chrome canvas and has had a frame to warm.
      if (handoffStartedAt === null && t >= m.handoff[0] && buddyReadyRef.current) {
        handoffStartedAt = t;
        setIntroState('handoff');
      }

      if (useShader && stage && from && to && stageRef.current === stage) {
        once('blip', t >= marks.face[0] + 120, () => soundEngine.play('blip'));
        // "Hey, I'm Buddy!" — once per run, only with sound on (the run itself was the gesture).
        // Asked for a little before the face finishes forming: engines take ~50–300 ms to start.
        once('speak', t >= marks.face[0] + 60, () => buddyVoice.sayOnce(runId.current, spokenIntro));
        const shaderTime = handoffStartedAt === null
          ? Math.min(t, m.handoff[0])
          : m.handoff[0] + Math.min(handoffDuration, t - handoffStartedAt);
        const u = introUniforms(shaderTime, from, to, TERMINAL_RADIUS, !toThreeD, reducedMotion);
        u.alpha = handoffStartedAt === null
          ? 1
          : 1 - Math.max(0, Math.min(1, (t - handoffStartedAt) / handoffDuration));
        stage.set('u_time', t / 1000);
        stage.set('u_center', u.center);
        stage.set('u_half', u.half);
        stage.set('u_radius', u.radius);
        stage.set('u_morph', u.morph);
        stage.set('u_liquid', u.liquid);
        stage.set('u_chrome', u.chrome);
        stage.set('u_face', u.face);
        stage.set('u_smile', u.smile);
        stage.set('u_blink', u.blink);
        stage.set('u_settle', u.settle);
        stage.set('u_talk', buddyVoice.talk(performance.now()));
        stage.set('u_alpha', u.alpha);
        try {
          stage.draw();
          if (!shaderFrameVisible && t >= marks.swapStart) {
            shaderFrameVisible = true;
            setHandedOff(true);
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          console.error('[intro] Liquid Chrome draw failed:', error);
          window.removeEventListener('resize', onResize);
          markUnavailable(reason);
          return;
        }
      }

      if (handoffStartedAt !== null && t - handoffStartedAt >= handoffDuration) {
        window.removeEventListener('resize', onResize);
        probe?.report(t);
        finish('done');
      }
    });
    loopRef.current = loop;
    loop.start();
  }, [reducedMotion, webgl, shaderReady, finish, goTo, markUnavailable, onPrepareHandoff]);

  // Keep the latest run callback without capturing an obsolete state snapshot.
  runAction.current = run;
  useEffect(() => {
    if (!pendingRun.current) return;
    if (webgl && (!shaderReady || stageRef.current === null)) return;
    pendingRun.current = false;
    runAction.current();
  }, [webgl, shaderReady]);

  // Enter runs from anywhere (buttons keep their own Enter behaviour).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' || event.repeat) return;
      // Run and Skip keep their native Enter; everywhere else (incl. the sound switch) Enter runs.
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
      {webgl ? <LiquidScene stageRef={stageRef} active={shaderTransition} onReady={markShaderReady} onUnavailable={markUnavailable} /> : null}
      <TerminalScene
        typed={typed}
        outputLines={outputLines}
        ready={step === 'ready'}
        running={running}
        handedOff={handedOff && shaderTransition}
        fallbackExit={handedOff && !shaderTransition}
        touch={touch}
        onRun={run}
        windowRef={windowRef}
        runRef={runRef}
      />
      {shaderError ? <p className={styles.shaderError} role="status">Liquid Metal transition unavailable: {shaderError}</p> : null}
      <div className={styles.controls}>
        <IntroControls soundEnabled={soundEnabled} soundSupported={soundSupported} onSound={onSound} onSkip={skip} />
      </div>
    </div>
  );
}
