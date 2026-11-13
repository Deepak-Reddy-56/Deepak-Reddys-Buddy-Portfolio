# Reference implementation notes

## Source
- Repository: https://github.com/adamperlis/adamperlis.com
- The repository is an AngularJS + Gulp implementation with a minimal home page, separate project views, a fixed navigation header, numbered project index, previous/next controls and a long-form About page.
- The source repository's \`LICENSE\` is MIT; see \`THIRD_PARTY_NOTICES.md\`.

## Port decisions
- Rebuilt with the portfolio repository's React + TypeScript + Vite toolchain instead of carrying forward the legacy AngularJS/Gulp 3 dependency tree.
- Retained the recognizable information architecture and interactions: home, About, individually themed work pages, project number rail, previous/next controls and scroll navigation.
- Adapted six documented projects from Deepak Reddy's repositories.
- Replaced third-party imagery and profile assets with original CSS/SVG-style artwork so the site does not present another creator's project material as Deepak's.
- Project copy is limited to documented functionality, architecture, stacks and status. No unverified performance or business outcomes are added.

## Current routes
- \`/\`
- \`/about\`
- \`/project/secure-bms-provenance\`
- \`/project/sentinellog\`
- \`/project/lotlens\`
- \`/project/phishing-shield\`
- \`/project/campuscopilot\`
- \`/project/clara-co\`
