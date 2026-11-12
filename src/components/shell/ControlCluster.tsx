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

/**
 * The fixed, centred control cluster: Home · Sound · Menu.
 * Sits above the menu sheet, so the menu button doubles as Close.
 */
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
        <a href="#home" className={styles.control} onClick={onHome} aria-label="Home">
          <Icon name="home" size={17} />
        </a>
        <button
          type="button"
          className={styles.control}
          onClick={onToggleSound}
          aria-pressed={soundEnabled}
          aria-label="Sound"
          title={soundEnabled ? 'Sound on' : 'Sound off'}
        >
          <Icon name={soundEnabled ? 'sound-on' : 'sound-off'} size={17} />
        </button>
        <button
          ref={menuButtonRef}
          type="button"
          className={`${styles.control} ${styles.menuButton}`}
          onClick={onToggleMenu}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.burger} aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </nav>
    </header>
  );
}
