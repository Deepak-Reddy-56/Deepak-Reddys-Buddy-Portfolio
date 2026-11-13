# Deepak Reddy — Portfolio

A React/Vite recreation of the page structure and navigation patterns in the open-source reference repository [adamperlis/adamperlis.com](https://github.com/adamperlis/adamperlis.com), adapted to Deepak Reddy's projects and profile.

## Reference-led design

This branch follows the linked repository's portfolio pattern:

- Minimal fixed header with Work and About navigation.
- Centered landing page with oversized condensed name typography and a rotating professional descriptor.
- Individual, full-screen project title pages with distinct colour themes and a project-specific visual.
- Fixed numbered project rail, previous/next controls and scroll-to-top interaction.
- Long-form project pages with overview, workflow, implementation notes and technology lists.
- A separate About page with profile, education, skills and GitHub contact.

The implementation is rewritten in React and TypeScript with Vite. It does not reuse the reference owner's identity, profile photo, project images, or project copy. Project facts are based on the corresponding project repositories. No unverified customer metrics, deployment claims, or outcomes are presented.

## Projects

1. Secure BMS Provenance
2. SentinelLog
3. LotLens
4. Phishing Shield
5. CampusCopilot
6. Clara & Co.

Project information is data-driven in \`src/content/projects.ts\`. Add or edit a project there; the navigation rail and previous/next controls are generated from the same list.

## Local development

Requires Node.js 20 or newer.

\`\`\`bash
npm install
npm run dev
\`\`\`

Production build:

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Routing

- \`/\` — home
- \`/about\` — about
- \`/project/:slug\` — project detail page

\`vercel.json\` rewrites client-side routes to the Vite entry point so direct links and refreshes work on Vercel.

## Attribution

The page composition and interaction model are adapted from the public repository [adamperlis/adamperlis.com](https://github.com/adamperlis/adamperlis.com). Its repository includes an MIT license; the original copyright and license notice are retained in \`THIRD_PARTY_NOTICES.md\`. This implementation has been rewritten and uses original profile copy and project-specific visual artwork.
