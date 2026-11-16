import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react';
import { BuddySeat } from '../../components/buddy/BuddySeat';
import { Action } from '../../components/ui/Action';
import { SpokenLine } from '../../components/ui/SpokenLine';
import { dialogue } from '../../content/dialogue';
import { profile } from '../../content/profile';
import { site } from '../../content/site';
import { useBuddySpeech } from '../../features/buddy/buddySpeech';
import styles from './HeroSection.module.css';

/**
 * The hero, staged like a short scene:
 *   - during the intro Buddy stands in the middle and talks (caption below him);
 *   - the profile (top-left) and the navbar pop in when he introduces Deepak;
 *   - then he flies to his corner (top-right, line to his left), and the bio
 *     (bottom-left) and stats (bottom-right) come in. The middle stays open.
 */
export function HeroSection() {
  const spoken = useBuddySpeech();

  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.profile}>
        <span className={styles.photo} data-profile-part="photo">
          {profile.photo ? <img src={profile.photo} alt="" /> : <span aria-hidden="true">{site.monogram}</span>}
        </span>
        <h1 id="hero-title" className={styles.tag} data-profile-part="tag">
          <span className={styles.tagLead}>Hello, I’m {profile.name}.</span>
          <span className={styles.tagRest}>I’m a {profile.role.toLowerCase()}.</span>
        </h1>
      </div>

      <BuddySeat seat="hero" size="corner" line={dialogue.hero} spoken className={styles.corner} />

      {/* Intro only: where Buddy stands while he introduces himself and Deepak. */}
      <div className={styles.introStage} aria-hidden={spoken ? undefined : true}>
        <span className={styles.introSlot} data-intro-slot />
        <div className={styles.introCaption} aria-live="polite">
          {spoken ? <SpokenLine key={spoken.lead + '|' + (spoken.rest ?? '')} line={spoken} mode="voice" /> : null}
        </div>
      </div>

      <div className={styles.bio}>
        <p className={styles.bioText}>
          <span className={styles.bioLead}>{profile.bio.lead}</span> {profile.bio.rest}
        </p>
        <div className={styles.actions}>
          <Action href="#contact" className={styles.contact} onPointerMove={followPointer} onPointerLeave={resetPointer}>
            Contact
          </Action>
          <Action href="#work" variant="text" arrow>
            See the work
          </Action>
        </div>
      </div>

      <dl className={styles.stats}>
        {profile.stats.map((stat, i) => (
          <div key={stat.term} className={styles.stat} style={{ '--i': i } as CSSProperties}>
            <dt>{stat.term}</dt>
            <dd>
              <CountUp value={stat.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The Contact pill's chrome highlight follows the pointer across it. */
function followPointer(event: PointerEvent<HTMLAnchorElement>) {
  const el = event.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${(((event.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
  el.style.setProperty('--my', `${(((event.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
}

function resetPointer(event: PointerEvent<HTMLAnchorElement>) {
  event.currentTarget.style.removeProperty('--mx');
  event.currentTarget.style.removeProperty('--my');
}

/**
 * Numbers count up when the stats come in (html[data-details]); other values
 * simply appear. Without the intro the final value is shown straight away.
 */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const numeric = /^\d+$/.test(value) && value.length <= 3;

  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return;
    const root = document.documentElement;
    const target = Number(value);
    const pad = value.length;
    let raf = 0;
    const show = (n: number) => {
      el.textContent = String(n).padStart(pad, '0');
    };
    const run = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return show(target);
      const t0 = performance.now() + 250;
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - t0) / 1400));
        show(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      show(0);
      raf = requestAnimationFrame(tick);
    };
    // During the intro: wait for the details to come in, then count.
    if (root.dataset.intro && !root.dataset.details) {
      show(0);
      const observer = new MutationObserver(() => {
        if (root.dataset.details || !root.dataset.intro) {
          observer.disconnect();
          if (root.dataset.details) run();
          else show(target);
        }
      });
      observer.observe(root, { attributes: true, attributeFilter: ['data-details', 'data-intro'] });
      return () => {
        observer.disconnect();
        cancelAnimationFrame(raf);
      };
    }
    show(target);
    return () => cancelAnimationFrame(raf);
  }, [value, numeric]);

  return <span ref={ref}>{value}</span>;
}
