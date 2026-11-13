export type ProjectSection = {
  heading: string;
  body: string;
  bullets?: readonly string[];
};

export type PortfolioProject = {
  slug: string;
  number: string;
  name: string;
  eyebrow: string;
  client: string;
  title: string;
  subtitle: string;
  theme: string;
  visual: string;
  description: string;
  role: string;
  status?: string;
  stack: readonly string[];
  highlights: readonly string[];
  sections: readonly ProjectSection[];
  repo: string;
};

export const projects: readonly PortfolioProject[] = [
  {
    slug: 'secure-bms-provenance',
    number: '01',
    name: 'Secure BMS Provenance',
    eyebrow: 'BLOCKCHAIN · COMPONENT LIFECYCLE',
    client: 'TEAM PROJECT · FIVE CONTRIBUTORS',
    title: 'SECURE BMS COMPONENT PROVENANCE',
    subtitle: 'A role-based lifecycle, recorded on a permissioned ledger.',
    theme: 'bms',
    visual: 'ledger',
    description:
      'A component provenance application that records the journey of an EV Battery Management System component across manufacturing, certification, transport, warehouse custody and assembly.',
    role: 'Team project',
    stack: ['React', 'Node.js', 'MongoDB Atlas', 'Hyperledger Fabric'],
    highlights: [
      'Role-specific workflows for manufacturer, certifier, transporter, warehouse, assembler and auditor.',
      'Fabric chaincode enforces permissions and lifecycle transitions.',
      'Administrator-managed component types and location codes drive generated identifiers.',
      'Auditors can inspect provenance history through read-only access.',
    ],
    sections: [
      {
        heading: 'The context',
        body:
          'A component changes hands several times before it becomes part of a finished product. The application gives each stage a shared, verifiable record instead of treating provenance as a collection of disconnected updates.',
      },
      {
        heading: 'The lifecycle',
        body:
          'The workflow is organized around the component’s state. Each role receives the actions that belong to its stage, while the ledger keeps the chain of events connected.',
        bullets: [
          'Manufacturer registers a component.',
          'Certifier approves the manufactured component.',
          'Transporter creates a shipment.',
          'Warehouse receives the shipment and transfers custody.',
          'Assembler completes the assembly.',
          'Auditor reviews the history without changing it.',
        ],
      },
      {
        heading: 'The implementation',
        body:
          'The React frontend communicates with a Node.js API. MongoDB stores operational account and configuration data, while Hyperledger Fabric stores component state and lifecycle history. The chaincode is the authority for role permissions and valid transitions.',
        bullets: [
          'Google sign-in with server-side token verification and secure session cookies.',
          'Administrator-controlled component type and location registries.',
          'Generated component, shipment and assembly identifiers.',
          'Role-scoped API endpoints and transaction evidence for auditing.',
        ],
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/secure-bms-provenance',
  },
  {
    slug: 'sentinellog',
    number: '02',
    name: 'SentinelLog',
    eyebrow: 'SECURITY · LOG MONITORING',
    client: 'SECURITY SYSTEMS',
    title: 'SENTINELLOG',
    subtitle: 'Turning login events into signals worth paying attention to.',
    theme: 'sentinel',
    visual: 'sentinel',
    description:
      'A rule-based security log monitoring system that captures login activity, identifies suspicious patterns, blocks offending IP addresses and presents the results in an analytics console.',
    role: 'Security systems project',
    stack: ['Python', 'FastAPI', 'SQLite', 'Pandas', 'Chart.js'],
    highlights: [
      'Structured login logs are written to SQLite and a flat log file.',
      'Brute-force and high-frequency activity are detected using explicit rules.',
      'Offending IP addresses are automatically blocked by middleware.',
      'An admin console combines log review, alerts, analytics and IP controls.',
    ],
    sections: [
      {
        heading: 'The problem',
        body:
          'A stream of authentication events is difficult to investigate by reading raw log lines alone. SentinelLog gives those events structure, applies clear detection rules and puts the resulting alerts in one place.',
      },
      {
        heading: 'Detection rules',
        body:
          'The detection layer uses configurable, explainable thresholds rather than opaque scoring. This makes it easier to understand why an event was flagged.',
        bullets: [
          'Brute-force: at least five failed attempts within five minutes.',
          'High-frequency activity: at least fifteen attempts within one minute.',
          'Offending IPs are added to a block list and denied by middleware.',
        ],
      },
      {
        heading: 'The console',
        body:
          'The FastAPI application exposes log, alert, analytics and administrative endpoints. Pandas aggregates the event data; Chart.js presents summaries and timelines in the browser.',
        bullets: [
          'Login and session handling with HttpOnly cookies.',
          'Log viewer and alert list.',
          'Summary, timeline, top-user and top-IP analytics.',
          'Administrative block and unblock controls.',
        ],
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/SentinelLog',
  },
  {
    slug: 'lotlens',
    number: '03',
    name: 'LotLens',
    eyebrow: 'MANUFACTURING · INVESTIGATION MEMORY',
    client: 'DEVELOPMENT BUILD',
    title: 'LOTLENS',
    subtitle: 'Giving manufacturing investigations a memory.',
    theme: 'lotlens',
    visual: 'lotlens',
    description:
      'A manufacturing investigation agent that helps quality engineers connect historical defects, remember verified and unsuccessful corrective actions, and formulate evidence-backed next investigations.',
    role: 'Development build',
    status: 'Development build · not production-ready',
    stack: ['FastAPI', 'SQLAlchemy', 'React', 'TypeScript', 'Hindsight'],
    highlights: [
      'Case records remain the source of truth; recalled memory is checked against canonical database records.',
      'Historical cases can be recalled to inform the next investigation.',
      'Engineer-approved corrective actions and QA verification remain explicit human steps.',
      'The first investigation vertical slice is implemented.',
    ],
    sections: [
      {
        heading: 'The idea',
        body:
          'Manufacturing teams often investigate defects that resemble previous failures. The useful knowledge is not just the defect description; it is what was tried, what worked, what failed and what QA verified. LotLens explores how that history can be made useful during a new investigation.',
      },
      {
        heading: 'A memory-assisted workflow',
        body:
          'The application combines a conventional case record with a memory layer. Historical material can be recalled and synthesized, but it is matched back to canonical database records before it is presented as evidence.',
        bullets: [
          'Select a lot or investigation case.',
          'Recall relevant historical cases and corrective actions.',
          'Review evidence-backed suggestions before deciding what to investigate next.',
          'Record an engineer-approved action and submit QA verification.',
        ],
      },
      {
        heading: 'Current scope',
        body:
          'The first vertical slice is implemented, but the repository explicitly describes LotLens as a development build rather than a production-ready system. Authentication, organization-level isolation and production database migrations remain future work.',
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/LotLens',
  },
  {
    slug: 'phishing-shield',
    number: '04',
    name: 'Phishing Shield',
    eyebrow: 'SECURITY · MESSAGE ANALYSIS',
    client: 'WEB SECURITY',
    title: 'PHISHING SHIELD',
    subtitle: 'A second look before a suspicious message gets your trust.',
    theme: 'phishing',
    visual: 'shield',
    description:
      'A browser-based phishing analyzer that combines local message and URL heuristics with an optional Gemini verdict, extracted-link review and safe-reply generation.',
    role: 'Security project',
    stack: ['JavaScript', 'Gemini API'],
    highlights: [
      'Runs local heuristics for urgency, credential and payment requests, suspicious URL patterns and possible brand lookalikes.',
      'Shows a risk meter with Low, Medium and High levels, plus the signals behind the score.',
      'Can optionally request a Gemini analysis and generate a safe reply.',
      'Extracts links and displays findings about hostnames and URL characteristics.',
    ],
    sections: [
      {
        heading: 'The context',
        body:
          'Phishing attempts often rely on urgency, impersonation and links that look familiar at a glance. Phishing Shield explores a simple review step: inspect the message, identify its links and give the reader a clearer basis for deciding what to do next.',
      },
      {
        heading: 'The experience',
        body:
          'The user pastes an email, direct message or SMS. The local scan checks urgency, credential and financial language, punctuation, suspicious top-level domains, URL structure and possible lookalike brands. The risk meter and extracted-link panel make those signals visible.',
      },
      {
        heading: 'A practical boundary',
        body:
          'Gemini analysis is optional; heuristic checks run locally in the browser. The repository includes a settings panel for the Gemini key and describes local browser storage as demo-only. A production version should proxy AI requests server-side and keep credentials out of client code. A risk score is a triage aid, not a guarantee that a message is safe.',
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/Phishing-Shield',
  },
  {
    slug: 'campuscopilot',
    number: '05',
    name: 'CampusCopilot',
    eyebrow: 'PYTHON · DATA · ALGORITHMS',
    client: 'FIVE-HOUR HACKATHON · TEAM OF FIVE',
    title: 'CAMPUSCOPILOT',
    subtitle: 'A command line that knows its way around campus data.',
    theme: 'campus',
    visual: 'campus',
    description:
      'An interactive university assistant that combines pandas analytics, visualizations, a campus map and classical data-structures-and-algorithms techniques behind a fuzzy-matching command interface.',
    role: 'Hackathon team project',
    stack: ['Python', 'Pandas', 'Matplotlib', 'Folium'],
    highlights: [
      'Fuzzy-matched commands tolerate misspellings and alternate phrasing.',
      'Pandas handles student, finance, event and schedule data.',
      'Matplotlib charts and a Folium campus map provide visual context.',
      'Four classical algorithms power command matching and event operations.',
    ],
    sections: [
      {
        heading: 'The experience',
        body:
          'CampusCopilot is designed around natural-feeling commands rather than a long menu of rigid options. A user can ask for events, fees, exam schedules, student records or a campus map from one command loop.',
      },
      {
        heading: 'The algorithms',
        body:
          'The project uses familiar algorithms in practical places, making the underlying data work visible instead of hiding it behind a library call.',
        bullets: [
          'Levenshtein distance for typo-tolerant command matching.',
          'Activity selection for choosing non-overlapping events.',
          'Binary search for finding events by date in sorted data.',
          'Hash-table lookup for fast intent-keyword matching.',
        ],
      },
      {
        heading: 'The output',
        body:
          'Pandas produces the analytical summaries, Matplotlib writes charts and Folium builds an interactive campus map. The project was built for a five-hour hackathon by a team of five.',
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/CampusCopilot',
  },
  {
    slug: 'clara-co',
    number: '06',
    name: 'Clara & Co.',
    eyebrow: 'E-COMMERCE · FULL STACK',
    client: 'DIGITAL COMMERCE',
    title: 'CLARA & CO.',
    subtitle: 'An online storefront, from browsing to the admin side.',
    theme: 'clara',
    visual: 'clara',
    description:
      'An e-commerce storefront organized around the core shopping journey, with product discovery, search, checkout, account and administration areas.',
    role: 'E-commerce project',
    stack: ['Next.js', 'React', 'Firebase', 'Tailwind CSS'],
    highlights: [
      'Shop and product pages form the browsing experience.',
      'Search supports product discovery.',
      'Checkout and account areas cover the customer journey.',
      'An admin area provides a separate management surface.',
    ],
    sections: [
      {
        heading: 'The storefront',
        body:
          'Clara & Co. is structured around the path from discovering a product to completing a purchase. The project separates the shop, product detail, search, checkout and account areas so the main journeys have distinct places in the application.',
      },
      {
        heading: 'The application',
        body:
          'The frontend is built with Next.js and React, with Firebase in the application stack and Tailwind CSS for styling. The repository includes dedicated routes for the customer-facing pages and an admin area.',
      },
      {
        heading: 'The scope',
        body:
          'This portfolio entry describes the structure and technology documented in the project repository. It does not claim production sales, customer numbers or deployment outcomes.',
      },
    ],
    repo: 'https://github.com/Deepak-Reddy-56/clara-co',
  },
];

export const profile = {
  name: 'Deepak Reddy',
  title: 'Software Engineer · Backend & Full-stack Builder',
  location: 'Bengaluru, India',
  education: 'B.Tech, Computer Science · CHRIST (Deemed to be University)',
  graduation: '2028',
  github: 'https://github.com/Deepak-Reddy-56',
  summary:
    'I am a computer science student who enjoys building practical software: backend services, security tools, data-driven applications and full-stack products. I like understanding how a system works from the request all the way through to its data and deployment.',
  skills: [
    'C++', 'Python', 'JavaScript', 'Java', 'React', 'Node.js',
    'FastAPI', 'SQL', 'SQLite', 'MongoDB', 'Hyperledger Fabric',
    'Git', 'Docker', 'Vercel',
  ],
};
