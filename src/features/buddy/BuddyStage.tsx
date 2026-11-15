import { useEffect, useRef } from 'react';
import { LiquidMetal } from '@paper-design/shaders-react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { debugFlag } from '../../lib/debug';
import styles from './BuddyStage.module.css';

type Buddy = Awaited<ReturnType<typeof import('./three/createBuddy')['createBuddy']>>;

function setBuddyMode(mode: '3d' | null): void {
  const root = document.documentElement;
  if (mode) root.dataset.buddy = mode;
  else delete root.dataset.buddy;
}

/**
 * Buddy's renderers are normally deferred during the intro to keep GPU use low.
 * At the final reveal cue they are mounted behind the intro, warmed, and kept
 * alive across the overlay removal so the shader Buddy can hand off seamlessly.
 */
export function BuddyStage({
  menuOpen,
  introActive,
  prepareForHandoff,
  onReady,
}: {
  menuOpen: boolean;
  introActive: boolean;
  prepareForHandoff: boolean;
  onReady: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperSkinRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<Buddy | null>(null);
  const readySent = useRef(false);
  const reducedMotion = useReducedMotion();
  // Keep the renderers mounted when introActive becomes false after prewarming.
  const stageEnabled = !introActive || prepareForHandoff;

  useEffect(() => {
    const signalReady = () => {
      if (readySent.current) return;
      readySent.current = true;
      onReady();
    };

    if (!stageEnabled) {
      readySent.current = false;
      setBuddyMode(null);
      if (reducedMotion) return;
      let cancelled = false;
      import('./three/createBuddy')
        .then(() => {
          if (!cancelled) setBuddyMode('3d');
        })
        .catch(() => {
          if (!cancelled) setBuddyMode(null);
        });
      return () => {
        cancelled = true;
        setBuddyMode(null);
      };
    }

    if (reducedMotion) {
      setBuddyMode(null);
      signalReady();
      return;
    }

    const canvas = canvasRef.current;
    const paperSkin = paperSkinRef.current;
    if (!canvas || !paperSkin) {
      signalReady();
      return;
    }

    let cancelled = false;
    let buddy: Buddy | null = null;

    const clearBuddy = () => {
      buddy?.dispose();
      buddy = null;
      buddyRef.current = null;
      if (paperSkin.isConnected) delete paperSkin.dataset.ready;
      setBuddyMode(null);
    };

    const fallBack = () => {
      if (cancelled) return;
      clearBuddy();
      // A failed WebGL/Paper renderer must not leave the intro waiting forever.
      signalReady();
    };

    import('./three/createBuddy')
      .then(({ createBuddy }) => {
        if (cancelled) return;
        buddy = createBuddy(canvas, fallBack, paperSkin, signalReady);
        buddyRef.current = buddy;
        setBuddyMode('3d');
        if (__DEBUG__ && debugFlag('buddyDebug')) {
          (window as unknown as { __buddy?: () => unknown }).__buddy = () => buddy?.director.snapshot();
        }
      })
      .catch(fallBack);

    return () => {
      cancelled = true;
      clearBuddy();
    };
  }, [reducedMotion, stageEnabled, onReady]);

  useEffect(() => {
    buddyRef.current?.director.setMenuOpen(menuOpen);
  }, [menuOpen]);

  if (reducedMotion || !stageEnabled) return null;

  return (
    <>
      <div ref={paperSkinRef} className={styles.paperSkin} aria-hidden="true">
        <div className={styles.paperShader}>
          <LiquidMetal
            width={264}
            height={228}
            image="/buddy-mask.svg"
            colorBack="#a7aab2"
            colorTint="#ffffff"
            repetition={2.2}
            softness={0.14}
            shiftRed={0.3}
            shiftBlue={0.3}
            distortion={0.09}
            contour={0.4}
            angle={70}
            speed={0.72}
            scale={1}
            fit="contain"
            minPixelRatio={1}
            maxPixelCount={250000}
          />
        </div>

        <svg className={styles.face} viewBox="0 0 338 292" preserveAspectRatio="none">
          <g className={styles.eyeLeft}>
            <ellipse cx="81" cy="154" rx="29" ry="46" fill="#050506" transform="rotate(-9 81 154)" />
            <ellipse cx="74" cy="136" rx="10" ry="17" fill="#fff" />
            <ellipse cx="69" cy="168" rx="4" ry="5.5" fill="#fff" opacity="0.96" />
          </g>
          <g className={styles.eyeRight}>
            <ellipse cx="195" cy="140" rx="34" ry="49" fill="#050506" transform="rotate(5 195 140)" />
            <ellipse cx="185" cy="119" rx="11" ry="18" fill="#fff" />
            <ellipse cx="185" cy="160" rx="4.5" ry="6" fill="#fff" opacity="0.96" />
          </g>
          <ellipse className={styles.nose} cx="146" cy="203" rx="26" ry="18" fill="#050506" />
          <path className={styles.smile} d="M151 235 Q171 250 191 235" />
          <ellipse className={styles.talkingMouth} cx="171" cy="239" rx="15" ry="7" />
        </svg>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </>
  );
}
