import { useCallback, useEffect, useRef, useState } from 'react';
import { projects } from '../../content/projects';
import { getSection } from '../../content/sections';
import { BuddySeat } from '../../components/buddy/BuddySeat';
import { SectionLabel } from '../../components/ui/SectionLabel';
import { Icon } from '../../components/ui/Icon';
import { TwoTone } from '../../components/ui/TwoTone';
import { dialogue } from '../../content/dialogue';
import { ProjectArtwork } from './ProjectArtwork';
import section from './section.module.css';
import styles from './WorkSection.module.css';

const count = projects.length;
const repeatedProjects = [...projects, ...projects, ...projects];

function nearestCardIndex(viewport: HTMLDivElement, cards: Array<HTMLElement | null>): number {
  const center = viewport.scrollLeft + viewport.clientWidth / 2;
  let nearest = 0;
  let distance = Number.POSITIVE_INFINITY;
  cards.forEach((card, index) => {
    if (!card) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const nextDistance = Math.abs(cardCenter - center);
    if (nextDistance < distance) {
      distance = nextDistance;
      nearest = index;
    }
  });
  return nearest;
}

function centerCard(viewport: HTMLDivElement, card: HTMLElement, behavior: ScrollBehavior): void {
  viewport.scrollTo({
    left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
    behavior,
  });
}

/** Three copies create an infinite-feeling loop; the middle copy stays accessible. */
export function WorkSection() {
  const { number, label } = getSection('work');
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const rebasingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToProject = useCallback((nextIndex: number) => {
    const normalized = ((nextIndex % count) + count) % count;
    const viewport = viewportRef.current;
    const card = cardRefs.current[count + normalized];
    if (viewport && card) centerCard(viewport, card, 'smooth');
  }, []);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || frameRef.current !== null || rebasingRef.current) return;

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const current = nearestCardIndex(viewport, cardRefs.current);
      setActiveIndex(current % count);

      // Rebase to an identical card in the middle sequence at either loop edge.
      if (current < count || current >= count * 2) {
        const equivalent = current < count ? current + count : current - count;
        const target = cardRefs.current[equivalent];
        if (target) {
          rebasingRef.current = true;
          centerCard(viewport, target, 'instant');
          window.requestAnimationFrame(() => { rebasingRef.current = false; });
        }
      }
    });
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const firstCard = cardRefs.current[count];
    if (!viewport || !firstCard) return;
    const frame = window.requestAnimationFrame(() => centerCard(viewport, firstCard, 'instant'));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <section id="work" className={section.section} aria-labelledby="work-label">
      <div className={section.wide}>
        <BuddySeat seat="work" size="inline" line={dialogue.work} className={section.opener} />
        <div className={section.label}>
          <SectionLabel number={number} label={label} id="work-label" />
        </div>
        <div className={styles.heading}>
          <TwoTone
            className={styles.lede}
            lead="A few things I’ve made."
            rest="Different problems, different tools. The common thread is making the whole thing work."
          />
          <div className={styles.controls} aria-label="Project carousel controls">
            <span className={styles.counter} aria-live="polite" aria-atomic="true">
              {String(activeIndex + 1).padStart(2, '0')} <span>/</span> {String(count).padStart(2, '0')}
            </span>
            <button type="button" className={styles.arrow} onClick={() => scrollToProject(activeIndex - 1)} aria-label="Previous project">
              <Icon name="arrow-left" size={16} />
            </button>
            <button type="button" className={styles.arrow} onClick={() => scrollToProject(activeIndex + 1)} aria-label="Next project">
              <Icon name="arrow-right" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={styles.viewport}
        onScroll={handleScroll}
        aria-label="Selected projects. Scroll horizontally or use the arrow buttons."
        tabIndex={0}
      >
        <div className={styles.track}>
          {repeatedProjects.map((project, absoluteIndex) => {
            const accessible = Math.floor(absoluteIndex / count) === 1;
            return (
              <article
                key={project.slug + '-' + absoluteIndex}
                ref={(node) => { cardRefs.current[absoluteIndex] = node; }}
                className={styles.card}
                aria-label={project.name + ' project'}
                aria-hidden={!accessible}
              >
                <div className={styles.mediaMat}>
                  <ProjectArtwork kind={project.slug} />
                </div>
                <div className={styles.projectInfo}>
                  <div className={styles.projectCopy}>
                    <div className={styles.projectMeta}>
                      <span>{project.context ?? project.stack.slice(0, 2).join(' · ')}</span>
                      {project.status ? <span className={styles.status}>{project.status}</span> : null}
                    </div>
                    <h3 className={styles.projectName}>{project.name}</h3>
                    <p className={styles.summary}>{project.summary}</p>
                    <p className={styles.stack}>{project.stack.join(' · ')}</p>
                  </div>
                  <a
                    className={styles.repository}
                    href={project.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    tabIndex={accessible ? 0 : -1}
                    aria-label={'Open ' + project.name + ' GitHub repository in a new tab'}
                  >
                    Repository <Icon name="arrow-up-right" size={14} />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className={section.wide + ' ' + styles.footerNote}>
        <span>Swipe, scroll or drag to explore</span>
        <span>Original interface studies, built in code</span>
      </div>
    </section>
  );
}
