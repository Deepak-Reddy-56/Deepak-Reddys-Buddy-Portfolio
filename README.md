# Deepak Reddy — Buddy Portfolio

An interactive, story-led portfolio for a software engineer and product builder. This is an incremental build inspired by the craft, pacing, and playful character-led storytelling of [Adam Perlis](https://adamperlis.com/)—not a copy of its assets or identity.

## Direction

The goal is not a static résumé page. The experience should feel like a small digital product:

- A memorable first-contact sequence, not a generic hero banner.
- A custom 3D companion ("Buddy") that guides the visitor through the story without behaving like a chat widget.
- Scroll-led storytelling with carefully timed motion and purposeful transitions.
- Project case studies that show real work, decisions, architecture, and outcomes.
- An interactive playground where visitors can manipulate parts of the experience.
- Responsive, accessible, performant, and comfortable on reduced-motion devices.

## Build principles

1. Work in small, reviewable milestones. Do not ship the whole concept in one giant pass.
2. Keep a build log in `docs/BUILD_LOG.md` with decisions, prompts, changes, and validation.
3. Establish design tokens and motion rules before adding complex page sections.
4. Every showcased project and claim must be grounded in the owner's real work.
5. Prefer original assets, original writing, and original implementation. References inform the craft, not a pixel-for-pixel clone.
6. Test desktop and mobile; respect `prefers-reduced-motion`.

## Planned milestones

- [x] M0 — Repository and project brief
- [~] M1 — Reference study, visual system, and responsive shell (implemented, awaiting review)
- [ ] M2 — Entry sequence: terminal interaction and first reveal
- [ ] M3 — Buddy character prototype and motion language
- [~] M4 — Story-led home page and interactive project showcase (first implementation pass)
- [ ] M5 — Individual work / case-study pages
- [ ] M6 — Interactive Buddy playground
- [ ] M7 — About, skills, and contact experiences
- [ ] M8 — Performance, accessibility, SEO, and device QA
- [ ] M9 — Vercel production deployment

## Intended stack

React 19 + TypeScript (strict) + Vite, CSS Modules with global design tokens, self-hosted Geist fonts. Three.js / React Three Fiber (M3) and GSAP / Lenis (when choreography needs them) are added only by the milestone that requires them.

## Development log

See [docs/BUILD_LOG.md](docs/BUILD_LOG.md) for the decisions and changes made milestone by milestone.

## Local setup

Requires Node 20+.

```bash
npm install
npm run dev        # local dev server
npm run typecheck  # strict TypeScript
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
```

Contact links are configured with `VITE_CONTACT_EMAIL` and `VITE_LINKEDIN_URL` (see `.env.example`). Unset values hide the link.

## Structure

```
src/
  app/            App, AppShell (controls, menu, rail, progress, footer)
  pages/home/     Hero, About, Work, Contact sections
  components/
    shell/        ControlCluster, MenuSheet, SectionRail, ScrollProgress, SiteFooter
    ui/           Icon, Action, SectionLabel, TwoTone
    buddy/        BuddySeat, BuddyPlaceholder (replaced by the 3D Buddy in M3)
  content/        site, sections, projects, dialogue — the only place copy lives
  hooks/          active section, scroll progress/lock, focus trap, menu state, sound, reduced motion
  lib/motion.ts   reads motion tokens so JS timing matches CSS
  styles/         tokens.css (design tokens), base.css
```


### Liquid metal material
The intro terminal uses Paper's Liquid Metal shader (`@paper-design/shaders-react`, pinned at `0.0.82`) as a full-window material layer. Terminal copy remains DOM content above the canvas. Buddy's persistent Three.js head remains its own reflective 3D mesh for this first pass; the build log records that integration boundary.
