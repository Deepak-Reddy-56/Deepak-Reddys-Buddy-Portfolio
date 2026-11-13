# Adam Perlis 2026 — reference study and rebuild plan

**Target:** https://adamperlis.com/  
**Primary process source:** https://adamperlis.com/how-i-built-this/  
**Working branch:** adamperlis-current-rebuild  
**Baseline:** the deployed m3-buddy-character version supplied by Deepak, commit 44d0289e8d460d8fad0e2b6b2b9e9654258c17e3.

This is a study of the 2026 Adam Perlis site, not a port of the older AngularJS/Gulp source repository. The current site and the old repository are different generations and must not be conflated.

## 1. What makes the reference work

### Art direction
- Bright, near-white canvas with generous negative space.
- Small neutral sans-serif typography; hierarchy comes from weight, tone, scale restraint and spacing rather than oversized headings everywhere.
- A restrained palette of black, soft grey and a single small status accent.
- Rounded pill controls in a floating, inset control cluster. The menu is a deliberate full-screen surface, not a conventional horizontal navbar.
- Work is presented in large, calm image/screenshot frames on light grey mats. Avoid card grids with heavy borders, gradients or shadows.
- A single polished, liquid/chrome material becomes a recurring visual signature.
- Motion is choreographed and purposeful: it creates continuity between the terminal, Buddy, sections and project imagery. It should not make routine navigation slow.

### Experience architecture
The live site is broader than a one-page résumé. Its information architecture includes Home, Work, Skills, Playground, Services, About, How I built this, and Contact.

The terminal intro is an invitation to interact. It types a command (npx start @adamperlis), waits for a run action, then gives way to a liquid/chrome moment and the character. The character remains part of the page's storytelling system rather than behaving like a chat widget.

### Buddy
- One recurring character, with a consistent model/material and expression language.
- The character occupies intentional seats in the layout and travels between them.
- Short, contextual lines; not an open-ended assistant/chatbot.
- Character motion must respect content boundaries and not obscure text, navigation or project media.
- Provide a meaningful static fallback for reduced-motion and WebGL-unavailable environments.

### Work presentation and showreel
- Work needs project-specific visual evidence, not a generic list of technologies.
- The making-of article describes the showreel as live HTML/CSS scenes of the actual products, rendered frame by frame and assembled into a seamless, fast montage—not a set of screen recordings with captions.
- The documented final reel is about 55 seconds and 4K. This is a later production task, after case-study scenes are real.
- Grey rounded image mats and a grid that can pull back to reveal the larger composition are useful visual references.

## 2. Technical approach in the article

The article describes the current reference implementation as Astro 7 and Tailwind CSS 4 for a static site; GSAP and Lenis for motion/scroll choreography; Three.js for the custom Buddy; Paper's liquid-metal shader for the terminal/chrome visual language; Web Audio and pre-recorded voice with word timings; Playwright for automated browser checks; ffmpeg for video assembly; Cloudflare Pages for hosting; and DialKit for live parameter tuning in the Playground.

The article also documents iterations that were rejected, including an early chat-dock Buddy and page transitions that caused browser issues. These are useful negative findings: do not add complexity merely because a motion technique is available.

## 3. Public references reviewed

| Reference | What to take from it | Boundary |
|---|---|---|
| Adam Perlis live site and its Work, Skills, Services, About, Playground and Contact pages | Overall hierarchy, pacing, controls, content architecture and interactions | Re-express the design using Deepak's actual work and identity |
| Adam Perlis “How I Built This” | Process, stack, iteration history, terminal-to-character hand-off and showreel method | Treat as the primary technical narrative; don't imply access to Adam's private source |
| Yousuf's [WebGL Glass Carousel](https://github.com/Yousuf-developer/liquid-glass-carousel) | Infinite Three.js row, eased wheel/drag, focus mode, entry choreography and two-pass liquid-glass lens | Its code is MIT, but its demo imagery and font are explicitly excluded; use our own media |
| Josh Puckett's [DialKit](https://github.com/joshpuckett/dialkit) | Live tuning of sliders, toggles, colors, easing, spring values and timelines | Use for development/Playground tuning where it adds value |
| Paper Liquid Metal shader | Liquid-metal material controls and shader treatment | Our M2 terminal already has an original shader; compare before adding a dependency |
| [jib.design](https://jib.design/) | Restrained portfolio layout and neutral image/screenshot mats | Use as a visual reference, not as an asset source |
| David O'Reilly's *Her* | Character expressiveness and emotional restraint as an inspiration | Do not copy the film's character, animation or assets |
| [AICSS](https://aicss.dev/) | AI product UI patterns and component ideas | Some Pro source is not public; do not reconstruct or copy licensed components from previews |
| Metalab showreel / “What We Do” | Fast, composed product-montage pacing | Build original scenes from our own products |
| Basit A. Khan and Edo animation references | Motion references named in the making-of article | Direct X pages blocked automated access; exact reels were not frame-inspected |

The making-of page's credits also name Olga Dyakova's leadership-portfolio guide and Peter Bagi's portrait. The article's credit block does not provide direct URLs for those items.

## 4. Starting point in Deepak's repository

The specified Vercel URL was checked and returned HTTP 200. Vercel metadata identifies it as:
- Deployment: dpl_4A3Lmvp7nLut6Lyp5sbvYrUNiPuE
- Branch: m3-buddy-character
- Commit: 44d0289e8d460d8fad0e2b6b2b9e9654258c17e3
- Project: deepak-reddys-buddy-portfolio

A new branch, adamperlis-current-rebuild, was created from that exact commit. The supplied deployment, main, and the prior M3 branch have not been overwritten by this reference-study branch.

### Keep the existing work
The starting point already has meaningful original engineering:
- React 19 + TypeScript + Vite.
- M2 terminal sequence with a custom GLSL liquid/chrome morph and page hand-off.
- M3 procedural Three.js Buddy with original geometry/material, expressions, voice integration and scroll-linked journeys.
- One persistent Buddy canvas, section seats, menu travel and reduced-motion/WebGL fallbacks.
- Geist type system, design tokens, navigation shell, menu, scroll progress and focus handling.

Do not throw this away or migrate frameworks just to match Adam's stack. The site can reproduce the principles with the existing React/Vite implementation. Add GSAP, Lenis, Paper or other libraries only when a specific requirement justifies them and they coexist cleanly with the existing animation clock.

## 5. Build plan

### Phase A — current-site shell and visual language
- Preserve and verify the terminal-to-Buddy hand-off.
- Rework the fixed top controls/menu into the reference's inset floating pill cluster and deliberate sheet behaviour.
- Settle spacing, typography, neutral surfaces, grey screenshot mats and section transitions as reusable tokens/components.
- Make the navigation reflect the expanded information architecture.

### Phase B — Work and project evidence
- Build an interactive, responsive project carousel inspired by the public MIT carousel engine, with our own original visuals and media.
- Keep natural image aspect ratios and support wheel, touch and drag input.
- Add a focused project mode with deliberate entry/exit choreography.
- Build individual case studies from actual repositories. Keep team contributions, project status and capabilities accurately attributed.
- Prioritise real UI from the repos or original UI scenes built from their code. Do not make up customer logos, testimonials, usage metrics or outcomes.

### Phase C — the rest of the portfolio
- Skills/toolkit page with real capabilities.
- About page with education, background, projects and working principles.
- Services/collaboration section written for Deepak's actual career stage; don't copy Adam's consultancy positioning.
- Playground with practical controls for Buddy/material/expressions, with tuning controls kept out of the normal visitor experience unless intentionally exposed.
- Contact section with verified links only.
- A “How I Built This” page documenting our own implementation and decisions.

### Phase D — showreel
- Build self-contained HTML/CSS scenes for the actual products.
- Define a deterministic frame clock so every scene can be rendered reproducibly.
- Render and assemble the montage with ffmpeg only after the case-study scenes and visual identity are stable.
- Do not substitute screen recordings or text-heavy title cards for the method described in the reference.

### Phase E — quality and deployment
- Test desktop and narrow/mobile layouts, touch/drag, keyboard use, menu/focus behaviour and route transitions.
- Respect prefers-reduced-motion; retain no-WebGL and context-loss fallbacks.
- Measure real GPU performance and test real mobile browsers; prior M3 checks used headless Chrome/SwiftShader and do not prove real-device performance.
- Keep changes on this branch with its own Vercel preview. Promote only after owner review.

## 6. Content guardrails

Current candidate projects are drawn from Deepak's repositories: Secure BMS Provenance, LotLens, SentinelLog, Phishing Shield, CampusCopilot and Clara & Co. Descriptions, team context and development status must remain grounded in the actual source repositories. Correct the Clara & Co repository URL to the verified clara-co repository before linking it in the final site. Do not expose any API key that may have been committed in a project repository.

The Secure BMS Provenance and CampusCopilot repositories describe team work; do not present them as solely authored. LotLens is a development build, not a production-ready service. Do not invent performance statistics, users, customer names, awards or business outcomes.

## 7. Access and licensing notes

- The current-site repository linked in the article (adamperlis-2026) returned 404 when checked; treat it as unavailable/private. The article, live pages and public references are the available basis.
- Direct X links for the Basit A. Khan/Edo motion references returned 403 in this environment. They are listed as references in the article, but we cannot claim to have inspected those reels frame by frame.
- The carousel repository says its MIT license covers code only; demo images and font remain with their creators. Use original imagery and properly licensed fonts/assets.
- Do not copy Adam's Buddy, likeness, copy, private project imagery or portfolio content. Recreate the interaction principles with Deepak's own identity, model and project material.

## 8. Acceptance principles

A milestone is not complete just because it builds. It should:
1. Preserve the already-working terminal and Buddy foundation.
2. Have a clear visual comparison against the current Adam Perlis reference.
3. Use real Deepak project content and original visuals.
4. Pass typecheck/build and functional browser checks.
5. Work at desktop and mobile sizes, including reduced motion and no-WebGL fallback.
6. Be reviewed by Deepak on the branch preview before promotion.
