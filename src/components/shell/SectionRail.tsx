import type { MouseEvent } from 'react';
import { sections, type SectionId } from '../../content/sections';
import styles from './SectionRail.module.css';

type SectionRailProps = {
  activeId: SectionId;
  onNavigate: (id: SectionId) => void;
};

/** Quiet chapter indicator on wide screens. Labels appear on hover/focus. */
export function SectionRail({ activeId, onNavigate }: SectionRailProps) {
  const handle = (id: SectionId) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate(id);
  };

  return (
    <nav className={styles.rail} aria-label="Chapters">
      <ol>
        {sections.map((section) => {
          const isCurrent = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={styles.link}
                aria-current={isCurrent ? 'location' : undefined}
                onClick={handle(section.id)}
              >
                <span className={styles.dot} aria-hidden="true" />
                <span className={styles.label}>
                  <span className={styles.number}>{section.number}</span> {section.title}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
