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
 * Buddy's body uses Paper's Liquid Metal shader, clipped to a transparent
 * pebble mask. Three.js remains responsible for eyes, mouth, blink, speech,
 * pose and flight; its canvas is layered above this shader skin.
 */
export function BuddyStage({ menuOpen }: { menuOpen: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paperSkinRef = useRef<HTMLDivElement>(null);
  const buddyRef = useRef<Buddy | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const paperSkin = paperSkinRef.current;
    if (!canvas || !paperSkin || reducedMotion) return;
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
  }, [reducedMotion]);

  useEffect(() => {
    buddyRef.current?.director.setMenuOpen(menuOpen);
  }, [menuOpen]);

  if (reducedMotion) return null;

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
