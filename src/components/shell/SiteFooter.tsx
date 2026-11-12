import { site, socialLinks } from '../../content/site';
import { Icon } from '../ui/Icon';
import styles from './SiteFooter.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p>
        © {new Date().getFullYear()} {site.name} · Made in {site.location.split(',')[0]}
      </p>
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
