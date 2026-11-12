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
          <span className={styles.titleLead}>Hello, I’m Deepak.</span>
          <span className={styles.titleRest}>{site.tagline}</span>
        </h1>
      </div>

      <div className={styles.stage}>
        <BuddySeat seat="hero" size="hero" line={dialogue.hero} />
      </div>
    </section>
  );
}
