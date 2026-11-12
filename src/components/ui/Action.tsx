import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './Action.module.css';

type ActionProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** 'pill' = outlined primary action; 'text' = quiet secondary link. */
  variant?: 'pill' | 'text';
  /** Opens in a new tab and shows ↗. */
  external?: boolean;
  /** Shows → after the label. */
  arrow?: boolean;
  children: ReactNode;
};

/** Links styled as the site's two action types. */
export function Action({ variant = 'pill', external = false, arrow = false, className, children, ...rest }: ActionProps) {
  return (
    <a
      className={[styles.action, styles[variant], className].filter(Boolean).join(' ')}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...rest}
    >
      <span>{children}</span>
      {external ? <Icon name="arrow-up-right" size={13} className={styles.icon} /> : null}
      {arrow && !external ? <Icon name="arrow-right" size={14} className={styles.icon} /> : null}
      {external ? <span className="visually-hidden"> (opens in a new tab)</span> : null}
    </a>
  );
}
