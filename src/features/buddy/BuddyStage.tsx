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
 * Buddy's Paper skin and Three.js face are deliberately not mounted during
 * the terminal intro. This keeps their GPU contexts out of the shader compile
 * window. The JS module is preloaded only, so the intro knows the final target
 * is 3D without allocating a second renderer.
 */
export function BuddyStage({ menuOpen, introActive }: { menuOpen: boolean; introActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperSkinRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<Buddy | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setBuddyMode(null);
      return;
    }

    if (introActive) {
      let cancelled = false;
      setBuddyMode(null);
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

    const canvas = canvasRef.current;
    const paperSkin = paperSkinRef.current;
    if (!canvas || !paperSkin) return;
    let cancelled = false;
    let buddy: Buddy | null = null;

    const fallBack = () => {
      buddy?.dispose();
      buddy = null;
      buddyRef.current = null;
      if (paperSkin.isConnected) paperSkin.style.opacity = '0';
      setBuddyMode(null);
    };

    import('./three/createBuddy')
      .then(({ createBuddy }) => {
        if (cancelled) return;
        buddy = createBuddy(canvas, fallBack, paperSkin);
        buddyRef.current = buddy;
        setBuddyMode('3d');
        if (__DEBUG__ && debugFlag('buddyDebug')) {
          (window as unknown as { __buddy?: () => unknown }).__buddy = () => buddy?.director.snapshot();
        }
      })
      .catch(fallBack);

    return () => {
      cancelled = true;
      fallBack();
    };
  }, [reducedMotion, introActive]);

  useEffect(() => {
    buddyRef.current?.director.setMenuOpen(menuOpen);
  }, [menuOpen]);

  if (reducedMotion || introActive) return null;

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
