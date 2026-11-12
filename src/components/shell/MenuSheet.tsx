import type { CSSProperties, MouseEvent, RefObject } from 'react';
import { dialogue } from '../../content/dialogue';
import { sections, type SectionId } from '../../content/sections';
import { socialLinks } from '../../content/site';
import type { MenuPhase } from '../../hooks/useMenuState';
import { BuddySeat } from '../buddy/BuddySeat';
import { Icon } from '../ui/Icon';
import styles from './MenuSheet.module.css';

type MenuSheetProps = {
  phase: MenuPhase;
  activeId: SectionId;
  onNavigate: (id: SectionId) => void;
  onClose: () => void;
  activeLinkRef: RefObject<HTMLAnchorElement | null>;
};

/**
 * The menu: a rounded sheet inset from the viewport edges, over a dimmed page.
 * Buddy introduces it; sections are listed by number, current one in ink.
 * Mounted only while open or closing (see useMenuState).
 */
export function MenuSheet({ phase, activeId, onNavigate, onClose, activeLinkRef }: MenuSheetProps) {
  const handleLink = (id: SectionId) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onNavigate(id);
  };

  return (
    <>
      <div className={styles.backdrop} data-phase={phase} onClick={onClose} aria-hidden="true" />
      <div
        className={styles.sheet}
        data-phase={phase}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className={styles.inner}>
          <BuddySeat seat="menu" size="menu" line={dialogue.menu} className={styles.buddy} />

          <nav aria-label="Sections">
            <ol className={styles.list}>
              {sections.map((section, index) => {
                const isCurrent = section.id === activeId;
                return (
                  <li key={section.id} className={styles.item} style={{ '--i': index + 1 } as CSSProperties}>
                    <a
                      ref={isCurrent ? activeLinkRef : undefined}
                      href={`#${section.id}`}
                      className={styles.link}
                      aria-current={isCurrent ? 'location' : undefined}
                      onClick={handleLink(section.id)}
                    >
                      <span className={styles.number} aria-hidden="true">
                        {section.number}
                      </span>
                      <span className={styles.title}>{section.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <ul className={styles.social} style={{ '--i': sections.length + 2 } as CSSProperties}>
            {socialLinks().map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className={styles.socialLink}
                  {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                >
                  {link.label}
                  <Icon name="arrow-up-right" size={12} />
                  {link.external ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
