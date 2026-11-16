import type { RefObject } from 'react';
import styles from './TerminalScene.module.css';

export const PROMPT = '~ $';
export const COMMAND = 'npx start @deepak';
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
 * The glossy chrome terminal. Its surface is Buddy's own Liquid Metal body,
 * drawn underneath this box (see IntroSequence) — so when the command runs,
 * the terminal itself becomes Buddy. Text and the Run bar stay DOM: crisp,
 * selectable and accessible. A CSS chrome gradient stands in only until the
 * live surface is ready (or where WebGL is unavailable).
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
        <div className={styles.titlebar} aria-hidden="true">
          <span className={styles.trafficLights}><i /><i /><i /></span>
        </div>

        <div className={styles.body}>
          <p className={styles.host}>deepak@portfolio ~ zsh</p>
          <p className={styles.comment}># best with sound on</p>
          <p className={styles.line}>
            <span className={styles.prompt}>{PROMPT}</span>
            <span className={styles.command}>{command}</span>
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

        <div className={styles.runBar}>
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
    </div>
  );
}
