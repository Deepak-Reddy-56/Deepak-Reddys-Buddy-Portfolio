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
- [ ] M1 — Reference study, visual system, and responsive shell
- [ ] M2 — Entry sequence: terminal interaction and first reveal
- [ ] M3 — Buddy character prototype and motion language
- [ ] M4 — Story-led home page and project showcase
- [ ] M5 — Individual work / case-study pages
- [ ] M6 — Interactive Buddy playground
- [ ] M7 — About, skills, and contact experiences
- [ ] M8 — Performance, accessibility, SEO, and device QA
- [ ] M9 — Vercel production deployment

## Intended stack

The stack is deliberately kept flexible until M1. The likely direction is a static-first TypeScript frontend with WebGL/Three.js for the character and GSAP for choreographed motion. Avoid adding dependencies until a milestone needs them.

## Development log

See [docs/BUILD_LOG.md](docs/BUILD_LOG.md) for the decisions and changes made milestone by milestone.

## Local setup

Project scaffolding will be added in M1. Until then, this repository contains the project brief and build plan.
