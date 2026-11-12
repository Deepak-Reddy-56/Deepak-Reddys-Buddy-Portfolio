# Milestone plan

A visitor should feel that they have entered a small, thoughtful digital world—not opened a résumé.

## M1 — Visual foundation and responsive shell
**Goal:** establish the visual language and base navigation before building effects.
- White/off-white canvas, browser-like framing only where it adds meaning.
- Editorial typography, small labels, restrained borders, soft shadows and generous spacing.
- Desktop and mobile layout rules.
- Persistent minimal controls: home, sound, menu, Buddy dock/seat.
- Scroll chapter indicator and accessible menu.
- Motion token system and reduced-motion fallback.
**Acceptance:** responsive shell works on mobile and desktop; no 3D dependencies required yet.

## M2 — Introduction (implemented, awaiting review)
**Goal:** a visitor-triggered entry that feels like one continuous object: terminal → liquid chrome → Buddy → homepage.
- Self-typing terminal (`./start-buddy`), Enter / Run, Skip, Sound On/Off, replay from menu and footer.
- Zero-dependency WebGL stage; 2.5D SDF liquid-chrome shader with procedural environment (no HDRI, no network).
- The shader takes over the terminal's exact box, morphs to Buddy's exact homepage seat, then hands off to the DOM.
- Web Audio synthesised sounds, gesture-gated, preference-aware.
- First-visit only; reduced-motion and no-WebGL paths.
**Acceptance:** see `docs/M2_ACCEPTANCE.md`.

## M3 — Buddy prototype
**Goal:** original character with presence and personality.
- Own geometry and silhouette, facial features, eye direction, expressions.
- Idle, greet, attentive, curious, celebrate, and sleep states.
- Pointer gaze and gentle motion; no motion that blocks reading.
- Character occupies reserved layout space, never overlays content.
- Mobile performance fallback and static poster.
**Acceptance:** character feels intentional at common device sizes and maintains stable frame rate.

## M4 — Home story and project carousel
**Goal:** connect the introduction to real work.
- Short builder story.
- Horizontal/drag carousel with keyboard controls.
- Each project gets status, platform, short description, and proper external/demo links.
- Project imagery captured from actual builds, not generic placeholders.
**Acceptance:** all featured items have verified claims and useful links.

## M5 — Case studies
**Goal:** prove engineering and product thinking.
- Detail template with role, problem, constraints, architecture, trade-offs, results, and learnings.
- Screenshots/video placed within narrative.
- No fabricated metrics or outcomes.
**Acceptance:** each case study can be understood without reading a résumé.

## M6 — Explore pages and playground
**Goal:** turn the portfolio into an interactive showcase.
- Buddy controls (size, expression, material, voice/sound).
- At least two original motion experiments.
- Controls update the scene immediately.
- Provide reset and sensible ranges.
**Acceptance:** keyboard and touch accessible; safe reduced-motion state.

## M7 — About and contact
**Goal:** provide a human, direct way to connect.
- About story and timeline.
- Skills grouped by what Deepak builds.
- Contact form with clear validation and spam protection decision.
- Direct links for GitHub, LinkedIn, email, résumé.
**Acceptance:** all links tested; form has meaningful success/error feedback.

## M8 — QA and production polish
- Test Chrome, Firefox, Safari where available.
- Test real mobile layout.
- Lighthouse and bundle checks.
- Keyboard, focus states, contrast, labels and reduced motion.
- SEO, Open Graph and favicon.
- Error and loading states.

## M9 — Vercel launch
- Connect production branch.
- Verify environment and build settings.
- Deploy preview, inspect build logs and screenshots.
- Promote production only when checks pass.
- Add custom domain later if desired.
