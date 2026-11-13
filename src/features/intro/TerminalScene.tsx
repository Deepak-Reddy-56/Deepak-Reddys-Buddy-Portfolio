import type { RefObject } from 'react';
import { LiquidMetal } from '@paper-design/shaders-react';
import styles from './TerminalScene.module.css';

export const PROMPT = 'deepak@portfolio:~$';
export const COMMAND = './start-buddy';
const OUTPUT = ['→ polishing chrome… done', '→ waking buddy…'];

type TerminalSceneProps = {
  typed: number;
  outputLines: number;
  ready: boolean;
  running: boolean;
  handedOff: boolean;
  fallbackExit: boolean;
  touch: boolean;
  onRun: () => void;
  windowRef: RefObject<HTMLDivElement | null>;
  runRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Scene A — Paper's Liquid Metal fills the terminal window itself.
 * The text stays DOM so it remains crisp, selectable and accessible.
 * The existing intro morph takes over at Run and hands off to the 3D Buddy.
 */
export function TerminalScene({
  typed,
  outputLines,
  ready,
  running,
  handedOff,
  fallbackExit,
  touch,
  onRun,
  windowRef,
  runRef,
}: TerminalSceneProps) {
  const command = COMMAND.slice(0, typed);

  return (
    <div className={styles.scene} data-handed-off={handedOff || undefined} data-fallback-exit={fallbackExit || undefined}>
      <div ref={windowRef} className={styles.window}>
        <div className={styles.metalLayer} aria-hidden="true">
          <LiquidMetal
            className={styles.paperShader}
            width="100%"
            height="100%"
            colorBack="#AAAAAC"
            colorTint="#FFFFFF"
            shape="none"
            repetition={2}
            softness={0.1}
            shiftRed={0.3}
            shiftBlue={0.3}
            distortion={0.07}
            contour={0.4}
            angle={70}
            speed={0.7}
            scale={0.72}
            fit="contain"
            minPixelRatio={1.25}
            maxPixelCount={1600000}
          />
        </div>

        <div className={styles.titlebar} aria-hidden="true">
          <span className={styles.trafficLights}><i /><i /><i /></span>
          <span>deepak@portfolio ~ zsh</span>
        </div>

        <div className={styles.body}>
          <p className={styles.comment}># best with sound on</p>
          <p className={styles.line}>
            <span className={styles.prompt}>{PROMPT}</span> <span className={styles.command}>{command}</span>
            {!running ? <span className={styles.cursor} data-idle={ready || undefined} aria-hidden="true" /> : null}
          </p>
          {OUTPUT.slice(0, outputLines).map((line) => (
            <p key={line} className={styles.line + ' ' + styles.output}>
              {line}
            </p>
          ))}
          <p className="visually-hidden" aria-live="polite">
            {running ? 'Starting.' : ready ? 'Command ready: ' + COMMAND + '. Press Enter or Run to start.' : ''}
          </p>
        </div>
      </div>

      <div className={styles.runRow}>
        <p className={styles.hint}>
          {touch ? (
            'Tap Run to begin'
          ) : (
            <>
              Press <kbd className={styles.kbd}>return ⏎</kbd> to run
            </>
          )}
        </p>
        <button ref={runRef} type="button" className={styles.run} onClick={onRun} disabled={running}>
          Run <span aria-hidden="true">⏎</span>
        </button>
      </div>
    </div>
  );
}
