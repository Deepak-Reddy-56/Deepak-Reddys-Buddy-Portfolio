import { Fragment, type CSSProperties, type ElementType } from 'react';
import type { Line } from '../../content/dialogue';
import styles from './TwoTone.module.css';

type TwoToneProps = Line & {
  as?: ElementType;
  className?: string;
  /** Wrap each word so it can be revealed in sequence (intro, later voice sync). */
  words?: boolean;
};

function Words({ text, offset }: { text: string; offset: number }) {
  return text.split(' ').map((word, index) => (
    <Fragment key={index}>
      {index > 0 ? ' ' : null}
      <span className={styles.word} style={{ '--w': offset + index } as CSSProperties}>
        {word}
      </span>
    </Fragment>
  ));
}

/**
 * The site's core typographic device: a lead phrase in ink, the rest of the
 * sentence in grey. Hierarchy through colour, not size.
 */
export function TwoTone({ lead, rest, as: Tag = 'p', className, words = false }: TwoToneProps) {
  const leadCount = lead.split(' ').length;
  return (
    <Tag className={[styles.twoTone, className].filter(Boolean).join(' ')}>
      <span className={styles.lead}>{words ? <Words text={lead} offset={0} /> : lead}</span>
      {rest ? <span className={styles.rest}> {words ? <Words text={rest} offset={leadCount} /> : rest}</span> : null}
    </Tag>
  );
}
