import type { ElementType } from 'react';
import type { Line } from '../../content/dialogue';
import styles from './TwoTone.module.css';

type TwoToneProps = Line & {
  as?: ElementType;
  className?: string;
};

/**
 * The site's core typographic device: a lead phrase in ink, the rest of the
 * sentence in grey. Hierarchy through colour, not size.
 */
export function TwoTone({ lead, rest, as: Tag = 'p', className }: TwoToneProps) {
  return (
    <Tag className={[styles.twoTone, className].filter(Boolean).join(' ')}>
      <span className={styles.lead}>{lead}</span>
      {rest ? <span className={styles.rest}> {rest}</span> : null}
    </Tag>
  );
}
