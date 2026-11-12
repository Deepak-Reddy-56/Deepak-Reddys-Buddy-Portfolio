import type { RefObject } from 'react';
import styles from './TerminalScene.module.css';

export const PROMPT = 'deepak@portfolio:~$';
export const COMMAND = './start-buddy';
const OUTPUT = ['→ polishing chrome… done', '→ waking buddy…'];

type TerminalSceneProps = {
  typed: number;
  outputLines: number;
  ready: boolean;
  running: boolean;
  /** The shader has taken over; the DOM window fades out. */
  handedOff: boolean;
  /** No WebGL: the window shrinks away instead of melting into chrome. */
  fallbackExit: boolean;
  touch: boolean;
  onRun: () => void;
  windowRef: RefObject<HTMLDivElement | null>;
  runRef: RefObject<HTMLButtonElement | null>;
};

/**
 * Scene A — a small, clearly theatrical terminal. It types its own command;
 * the visitor runs it with Enter or the Run button.
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
          buddy — start
        </div>
        <div className={styles.body}>
          <p className={styles.comment}># not a real terminal. just the way in.</p>
          <p className={styles.line}>
            <span className={styles.prompt}>{PROMPT}</span> <span className={styles.command}>{command}</span>
            {!running ? <span className={styles.cursor} data-idle={ready || undefined} aria-hidden="true" /> : null}
          </p>
          {OUTPUT.slice(0, outputLines).map((line) => (
            <p key={line} className={`${styles.line} ${styles.output}`}>
              {line}
            </p>
          ))}
          <p className="visually-hidden" aria-live="polite">
            {running ? 'Starting.' : ready ? `Command ready: ${COMMAND}. Press Enter or Run to start.` : ''}
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
