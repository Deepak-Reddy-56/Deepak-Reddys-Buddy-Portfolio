import type { MouseEvent, RefObject } from 'react';
import type { MenuPhase } from '../../hooks/useMenuState';
import { Icon } from '../ui/Icon';
import styles from './ControlCluster.module.css';

type ControlClusterProps = {
  menuPhase: MenuPhase;
  onToggleMenu: () => void;
  onHome: (event: MouseEvent<HTMLAnchorElement>) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
};

/** One quiet floating pill: home, sound and the menu live in a single control. */
export function ControlCluster({
  menuPhase,
  onToggleMenu,
  onHome,
  soundEnabled,
  onToggleSound,
  menuButtonRef,
}: ControlClusterProps) {
  const menuOpen = menuPhase === 'open';

  return (
    <header className={styles.cluster} data-menu={menuPhase}>
      <nav className={styles.controls} aria-label="Site controls">
        <a href="#home" className={styles.control} onClick={onHome} aria-label="Home" title="Home">
          <Icon name="home" size={16} />
        </a>
        <button
          type="button"
          className={styles.control}
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label="Sound"
          title={soundEnabled ? 'Sound on' : 'Sound off'}
        >
          <Icon name={soundEnabled ? 'sound-on' : 'sound-off'} size={16} />
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.menuLabel}>{menuOpen ? 'Close' : 'Menu'}</span>
          <span className={styles.burger} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </nav>
    </header>
  );
}
