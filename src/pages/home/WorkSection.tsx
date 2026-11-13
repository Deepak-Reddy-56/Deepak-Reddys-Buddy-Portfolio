import { BuddySeat } from '../../components/buddy/BuddySeat';
import { Icon } from '../../components/ui/Icon';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { TwoTone } from '../../components/ui/TwoTone';
import { dialogue } from '../../content/dialogue';
import { projects } from '../../content/projects';
import { getSection } from '../../content/sections';
import section from './section.module.css';
import styles from './WorkSection.module.css';

/**
 * M1: a quiet, verified project index that sets the section's rhythm.
 * M4 replaces the list with the interactive carousel; M5 adds case studies.
 */
export function WorkSection() {
  const { number, label } = getSection('work');

  return (
    <section id="work" className={section.section} aria-labelledby="work-label">
      <div className={section.column}>
        <BuddySeat seat="work" size="inline" line={dialogue.work} className={section.opener} />
        <div className={section.label}>
          <SectionLabel number={number} label={label} id="work-label" speakKey="work" />
        </div>
        <TwoTone
          className={styles.lede}
          lead="Things I’ve built."
          rest="Systems, products and a couple of hackathon sprints. Full stories are on the way."
        />

        <ol className={styles.list}>
          {projects.map((project, index) => (
            <li key={project.slug}>
              <a className={styles.project} href={project.repo} target="_blank" rel="noreferrer noopener">
                <span className={styles.head}>
                  <span className={styles.index} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.name} data-buddy-speak={`project:${project.slug}`}>{project.name}</span>
                  {project.status ? (
                    <span className={styles.status}>
                      <span className={styles.dot} aria-hidden="true" />
                      {project.status}
                    </span>
                  ) : null}
                </span>
                <span className={styles.summary}>{project.summary}</span>
                <span className={styles.meta}>
                  <span className={styles.stack}>{project.stack.join(' · ')}</span>
                  {project.context ? <span className={styles.context}>{project.context}</span> : null}
                </span>
                <span className={styles.repo}>
                  Repository <Icon name="arrow-up-right" size={12} />
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
