import styles from './BuddyPlaceholder.module.css';

/**
 * M1 stand-in for Buddy: a CSS-only chrome pebble with eyes, used to lock in
 * scale, placement and rhythm. M3 replaces it with the real 3D character
 * behind the same BuddySeat interface. Decorative — the seat carries the text.
 */
export function BuddyPlaceholder() {
  return (
    <span className={styles.root} aria-hidden="true">
      <span className={styles.body}>
        <span className={styles.sheen} />
        <span className={styles.face}>
          <span className={styles.eye} />
          <span className={styles.eye} />
          <span className={styles.mouth} />
        </span>
      </span>
    </span>
  );
}
