import { useEffect, useRef, type RefObject } from 'react';
import { ShaderStage } from '../../lib/webgl/ShaderStage';
import { liquidChromeFragment } from './liquidChrome.frag';
import styles from './LiquidScene.module.css';

type LiquidSceneProps = {
  stageRef: RefObject<ShaderStage | null>;
  active: boolean;
  onReady: () => void;
  onUnavailable: (reason?: string) => void;
};

/** Compile, render and read back an actual pixel before we claim this shader is ready. */
export function LiquidScene({ stageRef, active, onReady, onUnavailable }: LiquidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stage: ShaderStage | null = null;
    let warm = 0;

    try {
      stage = new ShaderStage(canvas, liquidChromeFragment, {
        onContextLost: () => onUnavailable('The browser lost the Liquid Chrome WebGL context.'),
      });
      stageRef.current = stage;

      warm = window.setTimeout(() => {
        if (!stage || stage.width < 2 || stage.height < 2) {
          onUnavailable('The Liquid Chrome canvas has no measurable size.');
          return;
        }

        try {
          const halfW = Math.max(36, Math.min(100, stage.width * 0.18));
          const halfH = Math.max(30, Math.min(80, stage.height * 0.18));
          stage.set('u_time', 0);
          stage.set('u_center', [stage.width * 0.5, stage.height * 0.5]);
          stage.set('u_half', [halfW, halfH]);
          stage.set('u_radius', 22);
          stage.set('u_morph', 0);
          stage.set('u_liquid', 0);
          stage.set('u_chrome', 1);
          stage.set('u_face', 0);
          stage.set('u_smile', 0);
          stage.set('u_blink', 0);
          stage.set('u_settle', 0);
          stage.set('u_talk', 0);
          stage.set('u_alpha', 1);
          stage.draw();

          const pixel = stage.readPixelCss(stage.width * 0.5, stage.height * 0.5);
          const visible = pixel[3] >= 200 && pixel[0] + pixel[1] + pixel[2] > 12;
          if (!visible) {
            throw new Error('Shader compiled but its center pixel was transparent/black (RGBA ' + Array.from(pixel).join(',') + ').');
          }

          stage.set('u_alpha', 0);
          stage.draw();
          onReady();
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          console.error('[intro] Liquid Chrome render probe failed:', error);
          onUnavailable(reason);
        }
      }, 120);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.error('[intro] Liquid Chrome shader failed to initialize:', error);
      onUnavailable(reason);
    }

    return () => {
      window.clearTimeout(warm);
      stage?.dispose();
      if (stageRef.current === stage) stageRef.current = null;
    };
  }, [stageRef, onReady, onUnavailable]);

  return <canvas ref={canvasRef} className={styles.canvas} data-active={active ? 'true' : undefined} aria-hidden="true" />;
}
