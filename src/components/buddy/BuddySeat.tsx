import type { Line } from '../../content/dialogue';
import { TwoTone } from '../ui/TwoTone';
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
 * A place reserved for Buddy, with the line he says there. The slot never
 * renders a character of its own: the single live Buddy is positioned over it
 * (`data-buddy-seat`), so layout never shifts and no stand-in can appear.
 *
 * - hero:   large, centred, line below
 * - inline: small, line to the right — opens a section
 * - menu:   small, inside the menu sheet
 */
export function BuddySeat({ seat, size, line, className }: BuddySeatProps) {
  return (
    <figure className={[styles.seat, styles[size], className].filter(Boolean).join(' ')} data-buddy-seat={seat}>
      {/* Reserved space only: the one live Buddy (BuddyStage) is positioned over it. */}
      <span className={styles.slot} data-buddy-slot aria-hidden="true" />
      <figcaption className={styles.caption}>
        <span className="visually-hidden">Buddy says: </span>
        {/* Keyed by text, so a new line (Buddy speaking) reveals word by word again. */}
        <TwoTone key={line.lead + '|' + (line.rest ?? '')} as="span" lead={line.lead} rest={line.rest} className={styles.line} words />
      </figcaption>
    </figure>
  );
}
