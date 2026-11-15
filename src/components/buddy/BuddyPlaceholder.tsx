import styles from './BuddyPlaceholder.module.css';

/**
 * Lightweight animated stand-in used only before the live Paper shader is ready
 * or when reduced motion / unavailable GPU rendering prevents the live material.
 */
export function BuddyPlaceholder() {
  return (
    <span className={styles.root} aria-hidden="true">
      <span className={styles.body}>
        <span className={styles.ribbon} />
        <span className={styles.face}>
          <span className={styles.eyeLeft}><i /></span>
          <span className={styles.eyeRight}><i /></span>
          <span className={styles.nose} />
          <span className={styles.smile} />
        </span>
      </span>
    </span>
  );
}
