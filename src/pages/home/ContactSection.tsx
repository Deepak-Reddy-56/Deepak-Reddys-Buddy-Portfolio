import { BuddySeat } from '../../components/buddy/BuddySeat';
import { Action } from '../../components/ui/Action';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { TwoTone } from '../../components/ui/TwoTone';
import { dialogue } from '../../content/dialogue';
import { getSection } from '../../content/sections';
import { site } from '../../content/site';
import section from './section.module.css';
import styles from './ContactSection.module.css';

export function ContactSection() {
  const { number, label } = getSection('contact');
  const { email, linkedin, github } = site.contact;

  return (
    <section id="contact" className={`${section.section} ${styles.contact}`} aria-labelledby="contact-label">
      <div className={section.column}>
        <BuddySeat seat="contact" size="inline" line={dialogue.contact} className={section.opener} />
        <div className={section.label}>
          <SectionLabel number={number} label={label} id="contact-label" speakKey="contact" />
        </div>
        <TwoTone lead="Building something, or hiring someone who builds?" rest="Tell me what you’re making." />

        <div className={section.actions}>
          {email ? (
            <Action href={`mailto:${email}`} variant="pill">
              Email me
            </Action>
          ) : null}
          <Action href={github} variant={email ? 'text' : 'pill'} external>
            GitHub
          </Action>
          {linkedin ? (
            <Action href={linkedin} variant="text" external>
              LinkedIn
            </Action>
          ) : null}
        </div>
      </div>
    </section>
  );
}
