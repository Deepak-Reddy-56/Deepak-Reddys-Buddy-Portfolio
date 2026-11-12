import styles from './SectionLabel.module.css';

type SectionLabelProps = {
  number: string;
  label: string;
  /** Render as a heading for the section's outline. */
  as?: 'h2' | 'p';
  id?: string;
};

/** "02  About" — a number in a soft pill, then the section's name. */
export function SectionLabel({ number, label, as: Tag = 'h2', id }: SectionLabelProps) {
  return (
    <Tag className={styles.label} id={id}>
      <span className={styles.number} aria-hidden="true">
        {number}
      </span>
      <span>{label}</span>
    </Tag>
  );
}
