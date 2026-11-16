import { BuddySeat } from '../../components/buddy/BuddySeat';
import { dialogue } from '../../content/dialogue';
import { profile } from '../../content/profile';
import { site } from '../../content/site';
import { useBuddySpeech } from '../../features/buddy/buddySpeech';
import styles from './HeroSection.module.css';

/**
 * Buddy's stage. During the intro he introduces himself, then Deepak: the
 * profile (photo + tag) pops up, with the bio bottom-left and stats bottom-right.
 */
export function HeroSection() {
  const spoken = useBuddySpeech();

  return (
    <section id="home" className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.profile}>
        <span className={styles.photo}>
          {profile.photo ? <img src={profile.photo} alt="" /> : <span aria-hidden="true">{site.monogram}</span>}
        </span>
        <h1 id="hero-title" className={styles.tag}>
          <span className={styles.tagLead}>I’m {profile.name}.</span>
          <span className={styles.tagRest}>I’m a {profile.role.toLowerCase()}.</span>
        </h1>
      </div>

      <div className={styles.stage}>
        <BuddySeat seat="hero" size="hero" line={spoken ?? dialogue.hero} />
      </div>

      <p className={styles.bio}>
        <span className={styles.bioLead}>{profile.bio.lead}</span> {profile.bio.rest}
      </p>

      <dl className={styles.stats}>
        {profile.stats.map((stat) => (
          <div key={stat.term} className={styles.stat}>
            <dt>{stat.term}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
