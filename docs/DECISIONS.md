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

## 2026-11-12 — M3
- **three.js directly, not React Three Fiber.** One character, one imperative controller, render-on-demand and a single clock; R3F would add a reconciler (~45 kB) and its own frame loop. three.js is lazy-loaded (own chunk, 134 kB gzip); main bundle +2 kB.
- **No GSAP / Lenis.** The flight is a pure function of scroll (`flight.ts`) plus a spring for catch-up; neither library added capability. Lenis stays a candidate if real devices show fixed-canvas vs. scroll desync.
- **One persistent canvas over the page** with an orthographic camera in CSS pixels → Buddy lands exactly on DOM-measured seats. `pointer-events: none`; z between the menu sheet and the controls.
- **Seats as DOM anchors.** `BuddySeat` reserves space; the 3D Buddy is the only character. Static placeholders remain as the reduced-motion / no-WebGL fallback.
- **Journey model.** Seated = glued to his seat; flights are tied to scroll (reversible), arrive when the next seat reaches the arrival line (36 % desktop, 30 % mobile) and take 0.7 / 0.55 viewport heights of scroll. Fast jumps switch to a speed-limited critically damped spring.
- **Long sections:** Buddy stays at a section's opening (he scrolls out of view with it while you read a long section) and flies back in for the next one. Alternative for review: a margin "dock" while his seat is off-screen.
- **Voice:** pluggable provider; Web Speech API for now. Quality varies: Safari/macOS/iOS and Chrome (Google voices) are good; Firefox uses OS voices; Android uses Google TTS; some Linux setups have none (caption only). No prerecorded asset, no paid TTS.
- **Intro hand-off:** with the 3D Buddy active the intro settles into a chrome ellipsoid of his silhouette (the CSS-card settle remains for the static fallback).
- **Performance:** scissor rendering of Buddy's box only; sleep when idle; QA manual clock and debug hooks behind a compile-time `__DEBUG__` constant.

## 2026-11-12 — M3 refinement
- **Long sections:** Buddy stays attached to the section's opening seat and scrolls out with it; he reappears at the next seat. Not docked in a margin (owner decision).
- **Routing over content:** flights are planned on a grid of real text line boxes and controls, inflated by Buddy's size. Order of preference: full-size route → tucked route (55 % size) → hop. A hop is preferred over any route that would cross readable content. Desktop routes prefer the open right side; the chapter rail column and the band under the top controls are off-limits during flight.
- **Speed:** journey progress is speed-limited (2.4 legs/s desktop, 2 on mobile), so a flick makes him fly his route quickly rather than teleport; arrival tolerance ±0.003 legs.
- **Material:** pearl-silver chrome lit by a procedural softbox studio (no HDRI download), with cyan/rose gels for a subtle rim iridescence; the intro shader blends to the same studio as the face forms.
- **Voice stays free and local:** Web Speech API only; primed in the user's gesture; no paid or external TTS.

## 2026-11-13 — M3 mobile and laptop flights
- **Edge corridor instead of hops.** At 390 the text column spans 20–370 px. Any on-screen path between two sections would have to cross a full-width text line, so no on-screen corridor exists. Buddy instead flies out along the empty seat row, runs just past the screen edge, and sweeps back in. He never pops in or out of existence.
- **Minimum flight scale 70 %, normally 80 %.** If a visible route needs less than 70 %, the route changes (edge corridor) rather than shrinking him further.
- **Time follows visibility.** Hidden stretches are flown quickly so the visible part of each flight gets most of the scroll distance.


## 2026-11-13 — M4.1
- One narration catalog; section arrival lines play once per page visit, while clicking a heading or project title replays its narration.
- Buddy tap reactions change expression on the same 3D model; no duplicate avatars or WebGL contexts.
- Voice remains local Web Speech for this slice. The provider is replaceable; ranked English voice selection, cancellation, a persistent voice preference API and a text-aware watchdog improve consistency without adding network or paid TTS dependencies.
- Sound-off means no speech. Captions remain available; pointer gestures prime browser speech for return visits.
- Reference-layout parity is a separate milestone so interaction logic and major layout changes are not mixed in one large patch.
