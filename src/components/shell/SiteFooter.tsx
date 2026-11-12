import { site, socialLinks } from '../../content/site';
import { Icon } from '../ui/Icon';
import styles from './SiteFooter.module.css';

export function SiteFooter({ onReplayIntro }: { onReplayIntro: () => void }) {
  return (
    <footer className={styles.footer}>
      <p>
        © {new Date().getFullYear()} {site.name} · Made in {site.location.split(',')[0]}
      </p>
      <button type="button" className={styles.replay} onClick={onReplayIntro} aria-label="Replay the introduction">
        $ ./start-buddy
      </button>
      <ul className={styles.links}>
        {socialLinks().map((link) => (
          <li key={link.label}>
            <a href={link.href} {...(link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}>
              {link.label}
              <Icon name="arrow-up-right" size={12} />
              {link.external ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
