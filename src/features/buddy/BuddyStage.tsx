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
      if (paperSkin.isConnected) paperSkin.style.opacity = '0';
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
        <LiquidMetal
          className={styles.paperShader}
          width="100%"
          height="100%"
          image="/buddy-mask.svg"
          shape="none"
          colorBack="#AAAAAC00"
          colorTint="#FFFFFF"
          repetition={2}
          softness={0.1}
          shiftRed={0.3}
          shiftBlue={0.3}
          distortion={0.07}
          contour={0.4}
          angle={70}
          speed={0.85}
          scale={1}
          fit="contain"
          minPixelRatio={1.25}
          maxPixelCount={900000}
        />
      </div>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </>
  );
}
