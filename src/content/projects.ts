/**
 * Project index for M1. Every field below was taken from the project's own
 * repository (README, package.json, requirements.txt or file structure) on
 * 2026-11-12. Do not add roles, metrics, users or outcomes that the repos do
 * not state. Detailed case studies arrive in M5, after review with Deepak.
 *
 * Not yet listed: VROOM and InternPilot (repositories not found under
 * github.com/Deepak-Reddy-56 with those names).
 */
export type Project = {
  slug: string;
  name: string;
  /** One sentence, grounded in the repository. */
  summary: string;
  /** Stack as declared in the repository. */
  stack: string[];
  /** Context the repository itself states, e.g. team size. */
  context?: string;
  /** Only set when the repository states it. */
  status?: 'Development build';
  repo: string;
};

export const projects: readonly Project[] = [
  {
    slug: 'secure-bms-provenance',
    name: 'Secure BMS Provenance',
    summary:
      'Records a component’s lifecycle on a permissioned Fabric ledger, from manufacture and certification to shipping, custody transfer and assembly.',
    stack: ['Hyperledger Fabric', 'React', 'Node.js', 'MongoDB Atlas'],
    context: 'Team of five',
    repo: 'https://github.com/Deepak-Reddy-56/secure-bms-provenance',
  },
  {
    slug: 'lotlens',
    name: 'LotLens',
    summary:
      'A manufacturing investigation agent that remembers past defects and corrective actions, and suggests evidence-backed next steps.',
    stack: ['FastAPI', 'SQLAlchemy', 'React', 'TypeScript', 'Hindsight'],
    status: 'Development build',
    repo: 'https://github.com/Deepak-Reddy-56/LotLens',
  },
  {
    slug: 'sentinellog',
    name: 'SentinelLog',
    summary:
      'Logs login attempts, detects brute-force and high-frequency patterns, auto-blocks offending IPs and charts it all in an admin console.',
    stack: ['FastAPI', 'SQLite', 'Pandas', 'Chart.js'],
    repo: 'https://github.com/Deepak-Reddy-56/SentinelLog',
  },
  {
    slug: 'phishing-shield',
    name: 'Phishing Shield',
    summary:
      'Paste a suspicious message and get a risk rating, the links it contains and a suggested reply, analysed with Gemini.',
    stack: ['JavaScript', 'Gemini API'],
    repo: 'https://github.com/Deepak-Reddy-56/Phishing-Shield',
  },
  {
    slug: 'campuscopilot',
    name: 'CampusCopilot',
    summary:
      'A command-line university assistant with fuzzy-matched commands, pandas analytics, charts, a campus map and classic DSA under the hood.',
    stack: ['Python', 'pandas', 'matplotlib', 'Folium'],
    context: 'Five-hour hackathon, team of five',
    repo: 'https://github.com/Deepak-Reddy-56/CampusCopilot',
  },
  {
    slug: 'clara-co',
    name: 'Clara & Co.',
    summary: 'An e-commerce storefront with shop, product, search, checkout, account and admin sections.',
    stack: ['Next.js', 'React', 'Firebase', 'Tailwind CSS'],
    repo: 'https://github.com/Deepak-Reddy-56/Clara-Co',
  },
];
