# Design and implementation decisions

## 2026-11-12
- Use a new isolated repository and a new Vercel project.
- Build iteratively; each milestone should be reviewable and testable.
- The Adam Perlis site is a craft reference, not a source of copied identity or assets.
- Buddy is a working name for an original portfolio companion. His appearance and personality must be distinct.
- Avoid a generic chat bubble. Buddy's dialogue should be scene-aware and integrated into the page's story.
- Build the visual system and responsive shell before 3D.
- Use project evidence and real writing; keep unconfirmed claims out of the public site.
- Document every milestone and major design decision.

## 2026-11-12 — M1
- Typeface: Geist + Geist Mono, self-hosted. No external font requests.
- Visual direction: quiet editorial white; hierarchy through colour (ink lead / grey continuation), not size. One accent only (status dot).
- Styling: CSS Modules + global tokens. No Tailwind, GSAP or Lenis yet; motion is CSS until choreography needs a timeline (M2/M4).
- Motion tokens live in CSS; JS reads them so timers always match and reduced motion zeroes both.
- Scroll-driven UI never sets React state per scroll event.
- Buddy appears only in reserved seats (`BuddySeat`); M3 will move one shared character between seats.
- Contact destinations come from config/env and are hidden when unset — no placeholder links.
- Section rail sits in the right margin and only at ≥1240px, where it never touches content.

## 2026-11-12 — M2
- **Rendering: no three.js / R3F yet.** The intro is one full-viewport procedural shader. A ~130 kB-gzip engine (+~40 kB for R3F) would add nothing to a single quad. Built `ShaderStage` + `FrameLoop` instead (~3 kB). The GLSL chunks (`lib/webgl/glsl/chrome.ts`) are engine-agnostic and can drop into a three.js `ShaderMaterial` in M3. Whether M3's Buddy is a mesh (three/R3F) or an SDF in this same pipeline is an M3 decision.
- **2.5D SDF instead of raymarching:** shape = signed distance (rounded box ↔ ellipse, smooth-min droplets, noise); normals from a height profile of that distance; shading from a procedural studio environment + thin-film iridescence. Constant cost per pixel, early-exit outside bounds, fine on mobile.
- **Continuity by construction:** the shader starts at the terminal's measured rect and radius and ends at the hero seat's measured rect with the placeholder's face proportions and a pearl material, so both hand-offs are crossfades between near-identical images.
- **One clock:** `introTimeline.marks` drives uniforms, DOM milestones and sounds; the page reacts through `html[data-intro=playing|leaving|handoff]` in CSS.
- **Sound:** synthesised in Web Audio; default off; nothing before a user gesture; no voice/TTS yet.
- **Repeat visits:** intro autoplays only on the first visit (localStorage), never for deep links; replay is always available.
- **Placeholder float keyframes** now start/end at rest so the hand-off never jumps.

## 2026-11-12 — M2 refinement
- Environment is one continuous warped gradient (no horizon term): the dark equator came from reflecting a horizon line through the dome's centre.
- Hand-off: the shader's settled state is a GLSL mirror of the CSS placeholder (`lib/webgl/glsl/buddyCard.ts`), so the crossfade is between near-identical images. Keep the two in sync until M3 replaces both.
- Corner-ellipse distances are blended smoothly; hard quadrant selection left a shading kink.
- `FrameLoop` reads `performance.now()` (same timebase as CSS transitions/timers) rather than the rAF timestamp.
- Timing probe (`introDebug.ts`) exists only in dev/QA builds (`?introDebug`); stripped from production.
- Fallback reveals the page behind the terminal before it recedes; any draw failure or context loss finishes to the page.
