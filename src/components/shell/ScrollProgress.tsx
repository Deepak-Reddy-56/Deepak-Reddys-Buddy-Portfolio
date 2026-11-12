import styles from './ScrollProgress.module.css';

/**
 * Hairline reading-progress indicator. Driven purely by the
 * --scroll-progress custom property (see useScrollProgress) — no re-renders.
 */
export function ScrollProgress() {
  return <div className={styles.progress} aria-hidden="true" />;
}
