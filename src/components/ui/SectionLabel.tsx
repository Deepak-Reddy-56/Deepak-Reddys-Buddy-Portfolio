import styles from './SectionLabel.module.css';

type SectionLabelProps = {
  number: string;
  label: string;
  as?: 'h2' | 'p';
  id?: string;
  speakKey?: string;
};

/** Numbered chapter heading. Its title button replays Buddy's matching narration. */
export function SectionLabel({ number, label, as: Tag = 'h2', id, speakKey }: SectionLabelProps) {
  return (
    <Tag className={styles.label} id={id}>
      <span className={styles.number} aria-hidden="true">{number}</span>
      {speakKey ? (
        <button type="button" className={styles.trigger} data-buddy-speak={speakKey}>
          {label}
          <span className="visually-hidden"> — hear Buddy's description</span>
        </button>
      ) : <span>{label}</span>}
    </Tag>
  );
}
