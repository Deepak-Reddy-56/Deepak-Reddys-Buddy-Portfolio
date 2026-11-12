import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react';
import { ControlCluster } from '../components/shell/ControlCluster';
import { MenuSheet } from '../components/shell/MenuSheet';
import { ScrollProgress } from '../components/shell/ScrollProgress';
import { SectionRail } from '../components/shell/SectionRail';
import { SiteFooter } from '../components/shell/SiteFooter';
import { sectionIds, type SectionId } from '../content/sections';
import { useActiveSection } from '../hooks/useActiveSection';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useMenuState } from '../hooks/useMenuState';
import { useScrollLock } from '../hooks/useScrollLock';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { useSoundPreference } from '../hooks/useSoundPreference';
import { scrollToSection } from '../lib/motion';
import styles from './AppShell.module.css';

/**
 * The persistent frame around every page: controls, menu, progress, rail and
 * footer. Pages render as children; when routes arrive (M5) they slot in here.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const menu = useMenuState();
  const sound = useSoundPreference();
  const activeId = useActiveSection(sectionIds);

  const chromeRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const activeLinkRef = useRef<HTMLAnchorElement>(null);

  useScrollProgress();
  useScrollLock(menu.isOpen);
  useFocusTrap(chromeRef, menu.isOpen, { initialFocus: activeLinkRef, onEscape: menu.close });

  const navigate = useCallback(
    (id: SectionId) => {
      menu.close();
      // Wait one frame so the scroll lock has released before scrolling.
      requestAnimationFrame(() => scrollToSection(id));
    },
    [menu],
  );

  const goHome = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      navigate('home');
    },
    [navigate],
  );

  const backgroundInert = menu.isMounted;

  return (
    <>
      <a className={styles.skip} href="#main">
        Skip to content
      </a>

      <ScrollProgress />

      <div ref={chromeRef}>
        <ControlCluster
          menuPhase={menu.phase}
          onToggleMenu={menu.toggle}
          onHome={goHome}
          soundEnabled={sound.enabled}
          onToggleSound={sound.toggle}
          menuButtonRef={menuButtonRef}
        />
        {menu.isMounted ? (
          <MenuSheet
            phase={menu.phase}
            activeId={activeId}
            onNavigate={navigate}
            onClose={menu.close}
            activeLinkRef={activeLinkRef}
          />
        ) : null}
      </div>

      <div inert={backgroundInert} className={styles.page}>
        <SectionRail activeId={activeId} onNavigate={navigate} />
        <main id="main" tabIndex={-1} className={styles.main}>
          {children}
        </main>
        <SiteFooter />
      </div>
    </>
  );
}
