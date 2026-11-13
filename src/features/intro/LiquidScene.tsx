import { useEffect, useRef, type RefObject } from 'react';
import { ShaderStage } from '../../lib/webgl/ShaderStage';
import { liquidChromeFragment } from './liquidChrome.frag';
import styles from './LiquidScene.module.css';

type LiquidSceneProps = {
  stageRef: RefObject<ShaderStage | null>;
  onReady: () => void;
  onUnavailable: () => void;
};

/**
 * Scenes B and C — the canvas where the terminal turns to liquid chrome and
 * settles into Buddy. The stage is created, compiled and warmed on mount; it
 * then draws only when the orchestrator's clock asks it to.
 */
export function LiquidScene({ stageRef, onReady, onUnavailable }: LiquidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: ShaderStage | null = null;
    try {
      stage = new ShaderStage(canvas, liquidChromeFragment, { onContextLost: onUnavailable });
      stageRef.current = stage;
    } catch (error) {
      console.error('[intro] Liquid Chrome shader failed to compile or initialize:', error);
      onUnavailable();
    }
    // Warm-up: drivers finish building the GPU pipeline on the first draw. Do one
    // invisible draw while the terminal types, so pressing Run never hitches.
    const warm = window.setTimeout(() => {
      if (!stage) return;
      try {
        stage.set('u_alpha', 0);
        stage.set('u_half', [1, 1]);
        stage.draw();
        onReady();
      } catch (error) {
        console.error('[intro] Liquid Chrome shader warm-up failed:', error);
        onUnavailable();
      }
    }, 120);
    return () => {
      window.clearTimeout(warm);
      stage?.dispose();
      stageRef.current = null;
    };
  }, [stageRef, onReady, onUnavailable]);

  // Always composited (transparent until the shader's own alpha rises at the swap):
  // first-time canvas compositing is expensive, so it happens while the terminal types.
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
