import { useEffect, useState } from 'react';

const projects = [
  {
    number: '01',
    name: 'Secure BMS Provenance',
    category: 'Blockchain · Supply chain',
    description:
      'A permissioned ledger concept for tracking a component through its lifecycle, from manufacturer to assembly.',
    note: 'Hyperledger Fabric / Node.js',
    href: 'https://github.com/Deepak-Reddy-56/secure-bms-provenance',
    visual: 'visual-ledger',
  },
  {
    number: '02',
    name: 'SentinelLog',
    category: 'Security · Systems',
    description:
      'A rule-based security log monitoring system that looks for suspicious activity and turns it into actionable alerts.',
    note: 'Python / FastAPI / SQLite',
    href: 'https://github.com/Deepak-Reddy-56/SentinelLog',
    visual: 'visual-sentinel',
  },
  {
    number: '03',
    name: 'Phishing Shield',
    category: 'Security · Web',
    description:
      'A URL safety project exploring practical heuristics, domain lookalikes, and safer browsing decisions.',
    note: 'JavaScript / Express',
    href: 'https://github.com/Deepak-Reddy-56/Phishing-Shield',
    visual: 'visual-shield',
  },
];

function Icon({ name }: { name: 'home' | 'menu' | 'close' | 'arrow' | 'github' }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (name === 'home') {
    return (
      <svg {...common}>
        <path d="m3.5 10 8.5-7 8.5 7" />
        <path d="M5.5 9v11h13V9M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (name === 'menu') {
    return (
      <svg {...common}>
        <path d="M4 8h16M4 16h16" />
      </svg>
    );
  }

  if (name === 'close') {
    return (
      <svg {...common}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }

  if (name === 'github') {
    return (
      <svg {...common}>
        <path d="M9 19c-4.2 1.3-4.2-2.1-5.9-2.5M15 21v-3.2a2.8 2.8 0 0 0-.8-2.2c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.3 1.2a11.5 11.5 0 0 0-6 0C6.7 2.9 5.7 3.2 5.7 3.2a4.3 4.3 0 0 0-.1 3.2 4.7 4.7 0 0 0-1.3 3.3c0 4.6 2.8 5.6 5.5 5.9a2.8 2.8 0 0 0-.8 2.2V21" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}

function BuddyStandIn() {
  return (
    <div className="buddy-wrap" aria-label="Buddy, a glossy abstract companion character">
      <div className="buddy-shadow" />
      <div className="buddy-orb">
        <div className="buddy-ribbon" />
        <div className="buddy-face">
          <span className="buddy-eye buddy-eye-left"><i /></span>
          <span className="buddy-eye buddy-eye-right"><i /></span>
          <span className="buddy-mouth" />
        </div>
        <span className="buddy-glint buddy-glint-one" />
        <span className="buddy-glint buddy-glint-two" />
      </div>
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const sectionIds = ['home', 'about', 'work', 'contact'];

    const updateScrollState = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(maxScroll > 0 ? window.scrollY / maxScroll : 0);

      let current = 'home';
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.42) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    window.addEventListener('keydown', closeOnEscape);
    updateScrollState();

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const navigateTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <div className="page-grain" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ transform: `scaleY(${scrollProgress})` }} />
      </div>

      <header className="site-header">
        <a className="identity" href="#home" aria-label="Deepak Reddy, home">
          <span className="identity-avatar">DR</span>
          <span className="identity-copy">
            <strong>Deepak Reddy</strong>
            <small>Software engineer · Builder</small>
          </span>
        </a>

        <div className="header-controls" aria-label="Site controls">
          <button
            className="round-control"
            onClick={() => navigateTo('home')}
            aria-label="Go to home"
            title="Home"
          >
            <Icon name="home" />
          </button>
          <button
            className="round-control menu-control"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            title={menuOpen ? 'Close menu' : 'Menu'}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav className="menu-panel" id="site-menu" aria-label="Main navigation">
          <span className="menu-eyebrow">TAKE A LOOK AROUND</span>
          {[
            ['home', 'Introduction', '01'],
            ['about', 'The builder', '02'],
            ['work', 'Selected work', '03'],
            ['contact', 'Say hello', '04'],
          ].map(([id, label, number]) => (
            <button
              className="menu-link"
              key={id}
              onClick={() => navigateTo(id)}
            >
              <span className="menu-number">{number}</span>
              <span>{label}</span>
              <Icon name="arrow" />
            </button>
          ))}
          <p className="menu-footnote">A little world made with care in Bengaluru.</p>
        </nav>
      )}

      <aside className="section-rail" aria-label="Section navigation">
        {[
          ['home', 'Intro'],
          ['about', 'About'],
          ['work', 'Work'],
          ['contact', 'Contact'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={activeSection === id ? 'rail-link is-active' : 'rail-link'}
            aria-label={label}
            aria-current={activeSection === id ? 'location' : undefined}
          >
            <span />
          </a>
        ))}
      </aside>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-meta">
            <span>INDEPENDENTLY BUILT</span>
            <span>BASED IN BENGALURU, INDIA</span>
          </div>

          <div className="hero-content">
            <p className="eyebrow hero-eyebrow">
              HELLO, I'M DEEPAK <span className="eyebrow-dot" />
            </p>
            <h1>
              I build things
              <br />
              <span>that make sense.</span>
            </h1>
            <p className="hero-description">
              Software, systems, and thoughtful digital products.
              <br className="desktop-break" />
              Always curious about how things work under the hood.
            </p>

            <div className="buddy-stage">
              <BuddyStandIn />
              <div className="buddy-caption">
                <span className="caption-dot" />
                <p>
                  Oh, hi. I'm <strong>Buddy.</strong>
                  <br />
                  I'll show you around.
                </p>
              </div>
            </div>

            <button className="text-link hero-cta" onClick={() => navigateTo('about')}>
              Come on in <Icon name="arrow" />
            </button>
          </div>

          <div className="hero-bottom">
            <span>SCROLL TO EXPLORE</span>
            <span className="scroll-line" />
            <span>01 — 04</span>
          </div>
        </section>

        <section className="about-section section-pad" id="about">
          <div className="section-heading">
            <span className="section-number">01</span>
            <span className="eyebrow">THE PERSON BEHIND THE BUILDS</span>
          </div>
          <div className="about-grid">
            <h2>
              Curious by default.
              <br />
              <span>Builder by choice.</span>
            </h2>
            <div className="about-copy">
              <p className="large-copy">
                I'm a computer science student who enjoys turning messy
                problems into systems that are clear, useful, and dependable.
              </p>
              <p>
                Most of my time goes into backend engineering, full-stack
                products, security, and understanding what happens between a
                user's action and the system's response.
              </p>
              <p>
                I care about the details: a clean API, a thoughtful interface,
                a deployment that behaves, and the little interactions that
                make software feel considered.
              </p>
              <button className="text-link" onClick={() => navigateTo('work')}>
                See what I've been building <Icon name="arrow" />
              </button>
            </div>
          </div>
          <div className="about-foot">
            <span>COMPUTER SCIENCE · CHRIST UNIVERSITY</span>
            <span>LEARNING, BUILDING, REPEATING ↗</span>
          </div>
        </section>

        <section className="work-section section-pad" id="work">
          <div className="section-heading">
            <span className="section-number">02</span>
            <span className="eyebrow">A FEW THINGS I'VE PUT INTO THE WORLD</span>
          </div>
          <div className="work-intro">
            <h2>
              Less talking.
              <br />
              <span>More making.</span>
            </h2>
            <p>
              A selection of systems and products I've been working on.
              Each one taught me something different.
            </p>
          </div>

          <div className="project-list">
            {projects.map((project) => (
              <article className="project-row" key={project.number}>
                <div className={`project-visual ${project.visual}`}>
                  <span className="project-visual-index">{project.number}</span>
                  <div className="visual-mark" aria-hidden="true">
                    {project.visual === 'visual-ledger' && (
                      <div className="ledger-mark">
                        <span /><span /><span />
                      </div>
                    )}
                    {project.visual === 'visual-sentinel' && (
                      <div className="sentinel-mark"><i /><i /><i /></div>
                    )}
                    {project.visual === 'visual-shield' && (
                      <div className="shield-mark"><span>✓</span></div>
                    )}
                  </div>
                  <span className="visual-caption">PROJECT / {project.number}</span>
                </div>
                <div className="project-details">
                  <div className="project-topline">
                    <span>{project.category}</span>
                    <span>{project.number} / 03</span>
                  </div>
                  <h3>{project.name}</h3>
                  <p>{project.description}</p>
                  <div className="project-bottomline">
                    <span>{project.note}</span>
                    <a href={project.href} target="_blank" rel="noreferrer">
                      View repository <Icon name="arrow" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="work-note">
            This is only the beginning. Individual project stories and
            interactive walkthroughs are coming in the next build stages.
          </p>
        </section>

        <section className="contact-section section-pad" id="contact">
          <div className="section-heading">
            <span className="section-number">03</span>
            <span className="eyebrow">THE NEXT GOOD THING STARTS SOMEWHERE</span>
          </div>
          <div className="contact-content">
            <p className="eyebrow">HAVE SOMETHING INTERESTING IN MIND?</p>
            <h2>
              Let's make
              <br />
              <span>it happen.</span>
            </h2>
            <a className="contact-email" href="mailto:deepakreddy@example.com">
              Get in touch <Icon name="arrow" />
            </a>
          </div>
          <footer className="site-footer">
            <span>© {new Date().getFullYear()} DEEPAK REDDY</span>
            <div className="footer-links">
              <a href="https://github.com/Deepak-Reddy-56" target="_blank" rel="noreferrer">
                GitHub <Icon name="arrow" />
              </a>
              <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">
                LinkedIn <Icon name="arrow" />
              </a>
            </div>
            <span>MADE WITH CURIOSITY, IN BENGALURU.</span>
          </footer>
        </section>
      </main>
    </>
  );
}

export default App;
