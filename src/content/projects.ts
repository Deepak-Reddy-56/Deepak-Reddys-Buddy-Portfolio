/**
 * Project index. Descriptions, team context and status are grounded in each
 * project's own repository. Interface artwork is an original visual study,
 * not a screenshot of a deployed product.
 */
export type Project = {
  slug: string;
  name: string;
  summary: string;
  stack: string[];
  context?: string;
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
    context: 'Team project · five contributors',
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
    context: 'Five-hour hackathon · team of five',
    repo: 'https://github.com/Deepak-Reddy-56/CampusCopilot',
  },
  {
    slug: 'clara-co',
    name: 'Clara & Co.',
    summary: 'An e-commerce storefront with shop, product, search, checkout, account and admin sections.',
    stack: ['Next.js', 'React', 'Firebase', 'Tailwind CSS'],
    repo: 'https://github.com/Deepak-Reddy-56/clara-co',
  },
];
