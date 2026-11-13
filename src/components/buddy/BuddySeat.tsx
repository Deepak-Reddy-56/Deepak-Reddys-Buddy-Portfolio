import type { Line } from '../../content/dialogue';
import { TwoTone } from '../ui/TwoTone';
import { BuddyPlaceholder } from './BuddyPlaceholder';
import styles from './BuddySeat.module.css';

export type BuddySeatSize = 'hero' | 'inline' | 'menu';

type BuddySeatProps = {
  /** Unique seat name. M3's single shared Buddy will fly between seats by id. */
  seat: string;
  size: BuddySeatSize;
  line: Line;
  className?: string;
};

/**
 * A place reserved for Buddy, with the line he says there. In M1 it renders a
 * CSS placeholder; in M3 the 3D character occupies the same reserved box
 * (`data-buddy-seat`), so layout never shifts when he arrives.
 *
 * - hero:   large, centred, line below
 * - inline: small, line to the right — opens a section
 * - menu:   small, inside the menu sheet
 */
export function BuddySeat({ seat, size, line, className }: BuddySeatProps) {
  return (
    <figure className={[styles.seat, styles[size], className].filter(Boolean).join(' ')} data-buddy-seat={seat}>
      <span className={styles.slot} data-buddy-slot>
        <BuddyPlaceholder />
      </span>
      <figcaption className={styles.caption}>
        <span className="visually-hidden">Buddy says: </span>
        <TwoTone as="span" lead={line.lead} rest={line.rest} className={styles.line} words />
      </figcaption>
    </figure>
  );
}
