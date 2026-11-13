import { BuddySeat } from '../../components/buddy/BuddySeat';
import { dialogue } from '../../content/dialogue';
import { site } from '../../content/site';
import styles from './HeroSection.module.css';

export function HeroSection() {
  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.identity}>
        <span className={styles.monogram} aria-hidden="true">
          {site.monogram}
        </span>
        <h1 id="hero-title" className={styles.title}>
          <button type="button" className={styles.titleTrigger} data-buddy-speak="home">
            <span className={styles.titleLead}>Hello, I’m Deepak.</span>
            <span className={styles.titleRest}>{site.tagline}</span>
            <span className="visually-hidden"> — hear Buddy's introduction</span>
          </button>
        </h1>
      </div>

      <div className={styles.stage}>
        <BuddySeat seat="hero" size="hero" line={dialogue.hero} />
      </div>
    </section>
  );
}
