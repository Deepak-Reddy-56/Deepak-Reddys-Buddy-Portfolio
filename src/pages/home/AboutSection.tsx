import { Action } from '../../components/ui/Action';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { TwoTone } from '../../components/ui/TwoTone';
import { projects } from '../../content/projects';
import { getSection } from '../../content/sections';
import { site } from '../../content/site';
import section from './section.module.css';
import styles from './AboutSection.module.css';

const facts: { term: string; value: string }[] = [
  { term: 'Studying', value: site.education.degree },
  { term: 'University', value: site.education.institution },
  { term: 'Graduating', value: site.education.graduation },
  { term: 'Based in', value: site.location },
  { term: 'Projects here', value: String(projects.length).padStart(2, '0') },
];

export function AboutSection() {
  const { number, label } = getSection('about');

  return (
    <section id="about" className={section.section} aria-labelledby="about-label">
      <div className={section.wide}>
        <div className={section.label}>
          <SectionLabel number={number} label={label} id="about-label" />
        </div>

        <div className={styles.grid}>
          <div>
            <TwoTone
              className={section.lede}
              lead="I build software, end to end."
              rest="Backend systems, full-stack products and tools that solve a real problem. I like knowing what happens between a click and the response."
            />
            <p className={section.secondary}>
              Computer science at CHRIST University, Bengaluru, graduating in {site.education.graduation}. Most of what I
              learn, I learn by shipping something.
            </p>
            <div className={section.actions}>
              <Action href="#contact" variant="pill">
                Say hello
              </Action>
              <Action href="#work" variant="text" arrow>
                See the work
              </Action>
            </div>
          </div>

          <dl className={styles.facts}>
            {facts.map((fact) => (
              <div key={fact.term} className={styles.fact}>
                <dt>{fact.term}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
