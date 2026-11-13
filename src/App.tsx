import { useEffect, useMemo, useState } from 'react';
import { projects, profile, type PortfolioProject } from './content/projects';

type Route =
  | { page: 'home' }
  | { page: 'about' }
  | { page: 'project'; slug: string };

function routeFromPath(pathname: string): Route {
  if (pathname === '/about') return { page: 'about' };
  const match = pathname.match(/^\/project\/([^/]+)\/?$/);
  if (match) return { page: 'project', slug: match[1] };
  return { page: 'home' };
}

function pathForProject(project: PortfolioProject): string {
  return '/project/' + project.slug;
}

function useRoute() {
  const [route, setRoute] = useState<Route>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setRoute(routeFromPath(path));
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return { route, navigate };
}

function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' | 'down' | 'up' }) {
  const paths = {
    right: 'M4 12h15m-6-6 6 6-6 6',
    left: 'M20 12H5m6-6-6 6 6 6',
    down: 'M12 4v15m-6-6 6 6 6-6',
    up: 'M12 20V5m-6 6 6-6 6 6',
  };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[direction]} />
    </svg>
  );
}

function GithubMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.31-3.76-1.31-.5-1.28-1.23-1.62-1.23-1.62-1.01-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1 1.72 2.61 1.23 3.25.94.1-.73.39-1.23.71-1.52-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.21 1.15-2.99-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.14a10.7 10.7 0 0 1 5.6 0c2.14-1.44 3.08-1.14 3.08-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.77 1.15 2.99 0 4.29-2.61 5.23-5.1 5.51.4.35.76 1.03.76 2.08v3.08c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
    </svg>
  );
}

function SiteHeader({ navigate, active }: { navigate: (path: string) => void; active: string }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigate('/')} aria-label="Deepak Reddy home">
        <span className="brand-mark">DR</span>
        <span className="brand-name">DEEPAK REDDY</span>
      </button>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={active === 'work' ? 'active' : ''} onClick={() => navigate(pathForProject(projects[0]))}>WORK</button>
        <button className={active === 'about' ? 'active' : ''} onClick={() => navigate('/about')}>ABOUT</button>
      </nav>
      <a className="header-github" href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub profile">
        <GithubMark />
      </a>
    </header>
  );
}

function SocialLinks() {
  return (
    <div className="social-links">
      <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
        <GithubMark />
      </a>
    </div>
  );
}

function HomePage({ navigate }: { navigate: (path: string) => void }) {
  const roles = useMemo(() => ['Software Engineer', 'Backend Builder', 'Full-stack Developer', 'Computer Science Student'], []);
  const [roleIndex, setRoleIndex] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const timer = window.setInterval(() => setRoleIndex((value) => (value + 1) % roles.length), 2300);
    return () => window.clearInterval(timer);
  }, [roles]);

  return (
    <main className="home-page">
      <div className="watermark" aria-hidden="true">DR</div>
      <div className="home-center">
        <div className="hero-kicker"><span className="kicker-line" /> SOFTWARE · SYSTEMS · PRODUCT <span className="kicker-line" /></div>
        <h1 className="home-title">DEEPAK<br /><span>REDDY</span></h1>
        <div className="role-window" aria-live="polite">
          <span key={roles[roleIndex]} className="role-text">{roles[roleIndex]}</span>
        </div>
        <p className="home-intro">
          I build practical software, from backend systems<br className="desktop-only" />
          to thoughtful full-stack experiences.
        </p>
        <SocialLinks />
        <button className="home-work-link" onClick={() => navigate(pathForProject(projects[0]))}>
          EXPLORE MY WORK <Arrow />
        </button>
      </div>
      <div className="home-bottom">
        <span>BASED IN BENGALURU, INDIA</span>
        <span className="home-scroll-cue"><i /> SCROLL OR SELECT WORK</span>
        <span>PORTFOLIO · 2026</span>
      </div>
    </main>
  );
}

function ProjectArtwork({ project }: { project: PortfolioProject }) {
  return (
    <div className={'project-artwork art-' + project.visual} aria-label={project.name + ' visual'} role="img">
      <div className="art-grid" />
      <span className="art-corner art-corner-top">DR / {project.number}</span>
      <span className="art-corner art-corner-bottom">{project.eyebrow}</span>
      {project.visual === 'ledger' && (
        <div className="art-ledger">
          <div className="ledger-node node-a">MFG</div>
          <div className="ledger-line line-a" />
          <div className="ledger-node node-b">CERT</div>
          <div className="ledger-line line-b" />
          <div className="ledger-node node-c">SHIP</div>
          <div className="ledger-line line-c" />
          <div className="ledger-node node-d">ASSY</div>
          <div className="ledger-orbit" />
        </div>
      )}
      {project.visual === 'sentinel' && (
        <div className="art-sentinel">
          <div className="sentinel-ring ring-one" />
          <div className="sentinel-ring ring-two" />
          <div className="sentinel-ring ring-three" />
          <div className="sentinel-core"><span>LIVE</span><strong>LOG</strong></div>
          <i className="signal signal-one" /><i className="signal signal-two" /><i className="signal signal-three" />
        </div>
      )}
      {project.visual === 'lotlens' && (
        <div className="art-lotlens">
          <div className="lens-circle"><div /><div /><div /></div>
          <span className="lens-label label-one">CASE 014</span>
          <span className="lens-label label-two">ROOT CAUSE</span>
          <span className="lens-label label-three">VERIFIED</span>
        </div>
      )}
      {project.visual === 'shield' && (
        <div className="art-shield">
          <div className="shield-outline"><span>!</span></div>
          <i className="shield-spark spark-one" /><i className="shield-spark spark-two" />
          <span className="shield-label">MESSAGE REVIEW</span>
        </div>
      )}
      {project.visual === 'campus' && (
        <div className="art-campus">
          <div className="campus-map"><i /><i /><i /><i /><i /><i /><span className="map-route" /></div>
          <span className="campus-tag tag-one">EVENTS</span>
          <span className="campus-tag tag-two">DATA</span>
          <span className="campus-tag tag-three">CAMPUS</span>
        </div>
      )}
      {project.visual === 'clara' && (
        <div className="art-clara">
          <div className="clara-window">
            <div className="clara-window-top"><i /><i /><i /><span>CLARA & CO.</span></div>
            <div className="clara-display"><div className="clara-product product-one" /><div className="clara-product product-two" /><div className="clara-product product-three" /></div>
            <div className="clara-lines"><i /><i /></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectIndex({ current, navigate }: { current: number; navigate: (path: string) => void }) {
  return (
    <aside className="project-index" aria-label="Project navigation">
      <span className="index-label">SELECTED WORK</span>
      {projects.map((project, index) => (
        <button
          key={project.slug}
          className={current === index ? 'index-item is-current' : 'index-item'}
          onClick={() => navigate(pathForProject(project))}
          aria-label={'Open project ' + project.number + ': ' + project.name}
          aria-current={current === index ? 'page' : undefined}
          title={project.name}
        >
          {project.number}
        </button>
      ))}
    </aside>
  );
}

function ProjectControls({ index, navigate }: { index: number; navigate: (path: string) => void }) {
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  return (
    <div className="project-controls">
      <button onClick={() => navigate(pathForProject(previous))} aria-label={'Previous project: ' + previous.name}>
        <Arrow direction="left" /><span>PREVIOUS</span>
      </button>
      <button className="control-scroll" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
        <Arrow direction="up" />
      </button>
      <button onClick={() => navigate(pathForProject(next))} aria-label={'Next project: ' + next.name}>
        <span>NEXT</span><Arrow />
      </button>
    </div>
  );
}

function ProjectPage({ project, navigate }: { project: PortfolioProject; navigate: (path: string) => void }) {
  const index = projects.findIndex((item) => item.slug === project.slug);

  return (
    <main className={'project-page theme-' + project.theme}>
      <div className="project-hero">
        <div className="project-watermark" aria-hidden="true">{project.number}</div>
        <div className="project-hero-copy">
          <p className="project-eyebrow">{project.eyebrow}</p>
          <h1>{project.title}</h1>
          <p className="project-subtitle">~ &nbsp; {project.subtitle} &nbsp; ~</p>
          <div className="project-meta">
            <span>{project.client}</span>
            {project.status && <span className="project-status">{project.status}</span>}
          </div>
          <a className="project-launch" href={project.repo} target="_blank" rel="noreferrer">
            VIEW REPOSITORY <Arrow />
          </a>
        </div>
        <div className="project-art-holder"><ProjectArtwork project={project} /></div>
        <button className="project-scroll" onClick={() => document.getElementById('project-story')?.scrollIntoView({ behavior: 'smooth' })}>
          <span>SCROLL TO EXPLORE</span><Arrow direction="down" />
        </button>
      </div>

      <section className="project-story" id="project-story">
        <div className="story-intro">
          <div className="story-number">PROJECT {project.number}</div>
          <p>{project.description}</p>
        </div>

        <div className="story-divider" />
        <div className="story-highlight-grid">
          <div className="story-section-heading">
            <span>01 / AT A GLANCE</span>
            <h2>What it<br /><em>does.</em></h2>
          </div>
          <div className="story-highlights">
            {project.highlights.map((highlight, itemIndex) => (
              <div className="highlight-row" key={highlight}>
                <span>{String(itemIndex + 1).padStart(2, '0')}</span>
                <p>{highlight}</p>
              </div>
            ))}
          </div>
        </div>

        {project.sections.map((section, sectionIndex) => (
          <section className="story-chapter" key={section.heading}>
            <div className="chapter-index">0{sectionIndex + 2} / {section.heading.toUpperCase()}</div>
            <div className="chapter-content">
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.bullets && (
                <ul>
                  {section.bullets.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}

        <div className="stack-panel">
          <div>
            <span className="chapter-index">BUILT WITH</span>
            <h2>The tools<br /><em>behind it.</em></h2>
          </div>
          <div className="stack-list">
            {project.stack.map((item) => <span key={item}>{item}</span>)}
          </div>
        </div>

        <div className="story-end">
          <span>WANT TO LOOK CLOSER?</span>
          <h2>Explore the<br /><em>repository.</em></h2>
          <a className="project-launch project-launch-dark" href={project.repo} target="_blank" rel="noreferrer">
            OPEN SOURCE CODE <Arrow />
          </a>
        </div>
      </section>
      <ProjectControls index={index} navigate={navigate} />
      <ProjectIndex current={index} navigate={navigate} />
    </main>
  );
}

function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-hero">
        <div className="about-monogram">DR</div>
        <p className="about-kicker">A LITTLE ABOUT THE PERSON BUILDING THIS</p>
        <h1>THE BUILDER<br /><span>BEHIND THE BUILDS.</span></h1>
      </div>
      <div className="about-content">
        <div className="about-contact">
          <span>ABOUT / 01</span>
          <a href={profile.github} target="_blank" rel="noreferrer">GITHUB PROFILE <Arrow /></a>
        </div>
        <div className="about-main-copy">
          <h2>{profile.summary}</h2>
          <p>
            My interests sit around backend development, full-stack engineering, security and systems.
            I enjoy projects where the pieces have to work together: a clear data model, predictable
            business rules, a reliable API and an interface that makes the workflow understandable.
          </p>
        </div>

        <div className="about-info-grid">
          <div className="about-info-card">
            <span>EDUCATION</span>
            <h3>{profile.education}</h3>
            <p>Expected graduation · {profile.graduation}</p>
          </div>
          <div className="about-info-card">
            <span>LOCATION</span>
            <h3>{profile.location}</h3>
            <p>Building, learning and iterating.</p>
          </div>
        </div>

        <div className="about-skills">
          <div>
            <span>TOOLS & TECHNOLOGIES</span>
            <h2>A toolkit<br /><em>in progress.</em></h2>
          </div>
          <div className="skill-cloud">
            {profile.skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </div>
        <div className="about-footer-cta">
          <p>INTERESTED IN THE WORK?</p>
          <h2>Start with<br /><em>the projects.</em></h2>
          <a href={profile.github} target="_blank" rel="noreferrer" className="project-launch project-launch-dark">FIND ME ON GITHUB <Arrow /></a>
        </div>
      </div>
    </main>
  );
}

function SiteFooter({ navigate }: { navigate: (path: string) => void }) {
  return (
    <footer className="site-footer">
      <button onClick={() => navigate('/')} className="footer-brand">DEEPAK REDDY</button>
      <span>BUILT WITH CURIOSITY · BENGALURU, INDIA</span>
      <a href={profile.github} target="_blank" rel="noreferrer">GITHUB <Arrow /></a>
    </footer>
  );
}

export default function App() {
  const { route, navigate } = useRoute();
  const project = route.page === 'project' ? projects.find((item) => item.slug === route.slug) : undefined;
  const projectIndex = project ? projects.findIndex((item) => item.slug === project.slug) : -1;

  useEffect(() => {
    const theme = project ? 'theme-' + project.theme : route.page === 'about' ? 'theme-about' : 'theme-home';
    document.body.dataset.theme = theme;
    document.title = project
      ? project.name + ' — Deepak Reddy'
      : route.page === 'about'
        ? 'About — Deepak Reddy'
        : 'Deepak Reddy — Software Engineer & Builder';
  }, [project, route.page]);

  useEffect(() => {
    if (route.page !== 'project' || projectIndex < 0) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowRight') navigate(pathForProject(projects[(projectIndex + 1) % projects.length]));
      if (event.key === 'ArrowLeft') navigate(pathForProject(projects[(projectIndex - 1 + projects.length) % projects.length]));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate, projectIndex, route.page]);

  return (
    <>
      <SiteHeader navigate={navigate} active={route.page === 'about' ? 'about' : project ? 'work' : 'home'} />
      {project ? (
        <ProjectPage key={project.slug} project={project} navigate={navigate} />
      ) : route.page === 'about' ? (
        <AboutPage />
      ) : (
        <HomePage navigate={navigate} />
      )}
      <SiteFooter navigate={navigate} />
      {project && <div className="page-index-counter">{project.number} <span>/ 0{projects.length}</span></div>}
    </>
  );
}
