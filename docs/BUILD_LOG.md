# Build log

## 2026-11-12 — M0: project foundation

### Goal
Build a distinctive, interactive personal portfolio that takes inspiration from the supplied Adam Perlis reference while expressing Deepak's own work and personality.

### Reference observations
- The home page begins with a deliberately minimal introduction and a strong point of view.
- A terminal-like entry interaction gives the visitor something to do before the story begins.
- A recurring chrome character is used as a guide and storytelling device, not a chatbot overlay.
- Product work is presented as evidence, with concise editorial context and large visual frames.
- Scroll and motion are part of the narrative. Whitespace and restraint let each moment land.
- The Playground exposes real controls and lets visitors experiment with the character and visual systems.
- The making-of article documents decisions, failed experiments, and the iterative process.

### Our interpretation
- Build an original companion character called Buddy, with a distinct silhouette, face, material, personality, and voice.
- Use a short interactive "boot" moment to introduce the portfolio.
- Tell a coherent builder story: engineering, products, systems, experiments, and collaboration.
- Give major projects proper case studies rather than a wall of generic cards.
- Make the playground useful and tactile, with actual controls.
- Do not reuse Adam Perlis' character, copy, assets, or exact page composition.

### Confirmed project choices
- GitHub repository: Deepak-Reddy-56/Deepak-Reddys-Buddy-Portfolio
- Hosting target: a new Vercel project connected to this repository
- Build approach: incremental milestones with a review point after each
- Reference supplied: Awwwards Adam Perlis project page, screenshots, and walkthrough videos

### Next milestone: M1
Create a reference board and implementation brief, decide the visual system (type, spacing, surfaces, color, material), choose the static-first stack, then scaffold the responsive shell. Do not begin with the full 3D character or all content at once.

## 2026-11-12 — M1: visual foundation and responsive shell

### Reconnaissance findings
- The previous scaffold did not build: TypeScript 6 rejected the CSS side-effect import without Vite's client types. M1 had been marked mostly complete but was never compiled.
- All UI lived in one `App.tsx` and one dense stylesheet; scroll handling set React state on every scroll event; the menu lacked focus management, scroll lock and an exit state; the header scrolled away.
- The repository had no `.gitignore`.
- Project copy had been written without inspecting repositories. Phishing Shield was described as URL heuristics on Express; its repository is actually a Gemini-powered message analyser.

### Reference study (live site, desktop and 500px mobile)
- One neutral grotesk; most copy at ~15px. Hierarchy is colour: lead phrase in ink, continuation in grey.
- Fixed centred control cluster: 40px round buttons + wider menu pill, soft shadow.
- Menu: full-height sheet inset ~16px with ~24px radius over a dimmed page; Buddy + one line; numbered links, current in ink.
- Each section opens with a small Buddy seat and line, then a number-pill section label.
- 1440px rhythm: ~62px gutter, left-aligned content (~930px), 120–170px between blocks.
- Making-of: static Astro + Tailwind tokens, GSAP + Lenis, Three.js Buddy with a liquid-metal shader, pre-recorded voice with word timings, page transitions dropped because of Safari, early chat-dock Buddy rejected.
- Note: the reference's character is also named "Buddy" — our model, face, voice and lines must be clearly original (M3).

### What changed
- Fixed the build (`src/vite-env.d.ts`); added `.gitignore`, `.env.example`, favicon.
- New structure: `app/` (App, AppShell), `pages/home/` (Hero, About, Work, Contact + shared section rhythm), `components/shell|ui|buddy`, `content/`, `hooks/`, `lib/motion.ts`, `styles/tokens.css|base.css`.
- Self-hosted Geist + Geist Mono via `@fontsource-variable` (bundled, latin subset ~29 kB loaded).
- Motion durations defined once in CSS tokens and read by `lib/motion.ts`; zeroed under reduced motion.
- Scroll progress written to `--scroll-progress` once per frame; active section via IntersectionObserver.
- Menu state machine (`closed → open → closing`), focus trap, scroll lock, inert background.
- Verified project index from six repositories; VROOM and InternPilot not found under the expected names.

### Validation
`npm run typecheck` ✓ · `npm run build` ✓ · Playwright + Chrome screenshots at 1440 / 1024 / 390 · keyboard, Escape, backdrop, focus-return, navigation and reduced-motion checks pass · zero off-origin requests · no console errors.

### Fixed during visual review
Rail colliding with the facts column; awkward wrap of the university name; facts misaligned with the lede; progress line drawing over the menu backdrop; controls not settling inside the open sheet; unbalanced hero line wrap; missing favicon 404.

### Remaining / for owner review
- Draft copy in About and Buddy's lines needs Deepak's approval.
- Contact email and LinkedIn still unset (hidden until configured).
- Real-device Safari / Android check.

## Checkpoint — 2026-11-12 (end of M1)
- **Milestone:** M1 approved by owner after visual review (1440 / 1024 / 390). M2 not started.
- **Branch / commit:** `m1-visual-foundation` @ `2f4dfd6` (pushed). `main` untouched at `b8fcdf8`; not merged.
- **Deployment:** Vercel project `deepak-reddys-buddy-portfolio`, commit status **success** ("Deployment has completed").
  - Inspect: https://vercel.com/deepak-2630s-projects/deepak-reddys-buddy-portfolio/7h8ZivZvNVWYUscLYZew2cA6YxaW
  - Branch preview: https://deepak-reddys-buddy-portfolio-git-08e46c-deepak-2630s-projects.vercel.app/
  - Preview is behind Vercel Deployment Protection (redirects to Vercel login); rendered output not yet verified on the preview itself.
- **Pre-commit checks:** `git diff --check` clean · 6 projects, stacks match `src/content/projects.ts` and source repos · no placeholder contacts, secrets or `.env` files tracked · typecheck ✓ · build ✓.
- **Completed:** see the M1 entry above and `docs/M1_ACCEPTANCE.md`. Decisions: `docs/DECISIONS.md` (M1).
- **Known issues:** draft copy (About, Buddy lines) awaiting owner wording · contact email / LinkedIn unset (hidden) · VROOM / InternPilot repo URLs unknown · placeholder Buddy resembles the reference (M3 must be original) · no real-device test yet.
- **Exact next task:** owner opens the preview (or disables protection for previews) and checks it on a real phone; then plan M2 (entry sequence + liquid/chrome material) for approval.

## 2026-11-12 — M2: the introduction

### What changed
- New `src/features/intro/`: `IntroSequence` (orchestrator, one clock), `TerminalScene`, `LiquidScene`, `IntroControls`, `introTimeline`, `liquidChrome.frag`, `useIntroGate`.
- New `src/lib/`: `frameLoop.ts`, `easing.ts`, `webgl/ShaderStage.ts`, `webgl/glsl/chrome.ts`, `audio/soundEngine.ts`.
- M1 touch points (small, opt-in): AppShell (gate, inert/scroll-lock during intro, replay), MenuSheet + SiteFooter (replay), BuddySeat (`data-buddy-slot`, hero word reveal), TwoTone (`words`), useSoundPreference (drives the sound engine), reveal CSS in ControlCluster / Hero / Rail / BuddySeat / BuddyPlaceholder, tokens (`--z-intro`).

### Found and fixed during visual QA
- Fast ellipse SDF approximation returned ~0 at the centre → dark artifact; replaced with scaled-circle distance.
- Flat plateau in the height profile mirrored the horizon as a dark "lens"; bevel now spans the full depth.
- Chrome → DOM placeholder pop at hand-off; added a `settle` term easing to a pearl look.
- "Hammered foil" noise too busy; lower frequency/amplitude.
- Programmatic focus put a heavy ring on Run; the dialog itself now takes focus.
- Enter after clicking Sound On re-pressed "On" instead of running; sound options now let Enter run.

### Validation
See `docs/M2_ACCEPTANCE.md`. Typecheck ✓ · build ✓ · flows ✓ at 1440/1024/390 · reduced motion ✓ · no-WebGL ✓.

## 2026-11-12 — M2 refinement pass
- Chrome: removed the horizon term (cause of the equator seam); warped continuous environment; subtler iridescence.
- Hand-off: GLSL mirror of the CSS placeholder (`buddyCard.ts`), smooth silhouette blending, matched eye gradient and U-shaped mouth; breathing wobble now ends exactly at rest. Measured mean diff ≈1.6/255 (1440/1024/390).
- Timing: `FrameLoop` uses `performance.now()`; frame-accurate capture via Chrome virtual time confirms 3.6 s, synced, no jumps.
- Fallback: overlapped reveal (no blank frame, measured); draw failure / context loss → page.
- Sound: recorded real output; all four cues present; key clicks raised ~6 dB (still quietest).
- Fixed during the pass: a script slip emptied `liquidChrome.frag.ts` (untracked); rewritten in full and re-verified.

## 2026-11-12 — M2 pre-commit checks
**Performance.** The earlier "107 slow frames" came from the virtual-time capture (frames arrive in bursts per 33 ms step) and a >20 ms count — not a rendering measurement. The probe now reports p50/p95/p99/worst, frames >16.7 ms and >33.3 ms, the measured refresh rate and the WebGL renderer. Real-time runs in this sandbox: renderer **SwiftShader (software; no hardware acceleration)**, refresh 60 Hz (headless rAF). Two real stalls were found and fixed:
- Swap stall (worst frame 10.5 s at 1440, at timeline 622 ms): first-time compositing of the WebGL canvas when it became visible. Canvas is now composited from mount (transparent; shader alpha gates visibility).
- Pipeline warm-up: one invisible draw while the terminal types.
After fixes (software GL, so absolute values are not representative of a GPU): 1440 p50 292 / p95 331 / p99 349 / worst 379 ms; 1024 p50 177 / p95 199 / p99 204 / worst 207 ms; 390@2x p50 115 / p95 130 / p99 136 / worst 138 ms. Worst ≈ p99: flat frame times, no spikes. 60 fps on real hardware must be confirmed with the probe on a GPU.

**Sound** (recorded from the actual output stream). Peaks: startup −20 dBFS (10–90 % attack 163 ms), enter −27 dBFS, blip −29 dBFS (attack softened to 30 ms; measured 9.7 ms 10–90 %), key clicks ≈ −32 dBFS peak. No clipping. Sound off → 21.9 s recorded at −180 dBFS (digital silence). No AudioContext exists before a user gesture, even with "on" saved.

**Debug isolation.** Production bundle contains no probe code (0 matches for its identifiers). HUD appears only on dev/QA builds with `?introDebug`; never on production, never on the normal homepage.

## Checkpoint — 2026-11-12 (end of M2)
- **Milestone:** M2 approved and committed. M3 not started.
- **Branch / commit:** `m2-introduction` @ `834709a` (pushed; branched from `a73974e`). `main` (`b8fcdf8`) and `m1-visual-foundation` (`a73974e`) untouched; nothing merged.
- **Deployment:** Vercel commit status **success** ("Deployment has completed").
  - Inspect: https://vercel.com/deepak-2630s-projects/deepak-reddys-buddy-portfolio/GkAjTfHDapakjGHtijuGDiEPtXB4
  - Branch preview: https://deepak-reddys-buddy-portfolio-git-0fa936-deepak-2630s-projects.vercel.app/
  - Behind Vercel Deployment Protection (redirects to Vercel login); rendered output on the preview not yet verified.
- **Build/test:** typecheck ✓ · build ✓ (86 kB gzip JS) · functional suite ✓ (1440/1024/390, reduced motion, no-WebGL, sound, skip/replay) · frame-accurate capture ✓ (3.6 s, hand-off ≈1.6/255) · audio capture ✓ · debug isolation ✓.
- **Known issues:** GPU frame rate unverified (sandbox is software-rendered; use `npm run dev` → `/?intro&introDebug`) · sound character needs owner ear-test · draft copy, contact details, VROOM/InternPilot URLs pending · placeholder Buddy to be replaced by an original 3D Buddy in M3.
- **Exact next task:** owner opens the preview signed in (or disables preview protection) and runs the probe on a real device; then plan M3 (Buddy 3D character and animation system) for approval.

## 2026-11-12 — M3: Buddy, a real 3D character

### What changed
- New `src/features/buddy/`: `three/buddyModel.ts` (procedural model), `three/studioEnvironment.ts` (procedural PMREM studio), `three/BuddyRenderer.ts` (one WebGL context, ortho camera in CSS px, scissor rendering), `three/createBuddy.ts` (lazy entry), `BuddyDirector.ts` (one clock: scroll → journey → flight → pose → face → dialogue → render; sleeps when idle), `flight.ts` (pure journey maths), `expressions.ts`, `BuddyStage.tsx`.
- New `src/lib/voice/voice.ts` (pluggable voice, Web Speech provider, `sayOnce`, talk envelope), `src/lib/debug.ts`; `__DEBUG__` compile-time constant (vite.config.ts) — debug hooks removed from production.
- `FrameLoop`: QA-only manual clock (`?manualClock`). `soundEngine.isEnabled`.
- Dialogue config (`content/dialogue.ts`): hero "Hey, I'm Buddy!", About/Work/Contact drafts, seat expressions, spoken line.
- Small, opt-in M1/M2 edits: AppShell mounts `BuddyStage`; About gets a seat; seats reveal their line on arrival (`data-buddy-active`); placeholders hidden in 3D mode; TwoTone word hook + delay variable; intro speaks, animates the mouth (`u_talk`) and settles into the 3D silhouette when the 3D Buddy is active.
- Dependency: `three@0.181.2` (+ `@types/three`), lazy chunk 134 kB gzip; main bundle +2 kB.

### Found and fixed during QA
- Full-viewport fill made each frame expensive → scissor-render Buddy's box only.
- Menu seat measured once (didn't exist yet) → looked up live; Buddy now flies into the menu.
- Fast flicks dragged Buddy through intermediate seats → speed-limited critically damped spring catch-up (threshold 0.25 legs/frame), with a quick hand-back.
- Mid-flight speed peaked at 3× (cubic ease) → sine ease (≈1.6×).
- First blink scheduled at 2500 s (unit slip) → 2.5 s; he blinks now.
- Desktop flights alternated sides and could swing back across text → always bow into the open right side.
- Intro→3D hand-off settled into the CSS card look → ellipsoid chrome settle when 3D is active; materials converged (brightness 225.2 vs 225.8).
- Director timers mixed wall time and loop time → one clock.

### Validation
Frame-exact (manual clock, 30 fps) journeys at 1440/1024/390: 0.0 px landing error at all 7 pauses per width (incl. backwards and fast flicks), seated frames move exactly with the page, catch-up within its speed cap. Functional: voice once/replay/sound-off, single canvas, click-through, menu flight, resize re-alignment, reduced motion and no-WebGL fallbacks, no console errors. Idle: renders only around blinks after the 7.5 s bob window. Typecheck ✓ · build ✓.

## Checkpoint — 2026-11-12 (M3 implemented, awaiting review)
- **Milestone:** M3 on `m3-buddy-character` (from `5899c1d`), **uncommitted**, not pushed. `main`, `m1-visual-foundation`, `m2-introduction` untouched.
- **Latest commit on branch:** `5899c1d` (M2 checkpoint).
- **Build/test:** typecheck ✓ · build ✓ (main 88 kB gzip + lazy three chunk 134 kB) · journeys ✓ · functional ✓.
- **Known issues:** GPU frame rate and real-device scroll sync unverified (sandbox is software-rendered) · Web Speech voice quality varies by browser/OS; no voices in the sandbox, so speech audio itself is unheard here (call timing/once-ness verified) · intro→3D reflections differ in detail (≈10.7/255) · Buddy scrolls out of view with long sections (by design; review) · flights cross text briefly at desktop · large hero Buddy passes behind the controls on mobile during the first flight.
- **Exact next task:** owner reviews M3 recordings/stills; on approval commit `feat(m3): …`, push `m3-buddy-character`, verify the Vercel preview on a real device.

## 2026-11-12 — M3 refinement pass (routing, material, voice)

### What changed
- **Decision 1 (owner):** in long sections Buddy stays on his seat and scrolls out with it; he reappears for the next section. No margin docking.
- **Whitespace-aware routing** — new `src/features/buddy/route.ts` (pure). Content (every text line box, links, buttons, list items, badges) is rasterised into a grid, inflated by Buddy's half-size plus a margin; A* (with a closed set, corridor-centre and desktop right-side preference) finds a route; it is string-pulled and its corners rounded only where they stay clear; arc-length parametrised. Per leg: full size if there's room → a *tucked* route at 55 % size (restrained) → otherwise a *hop* (shrink at the old seat, pop in at the next; never crosses content). Seats' own captions are excluded (hidden while he's away). The fixed chapter rail is a closed column; flights ease below the fixed top controls.
- `BuddyDirector`: journey J now follows the scroll with an exact critically damped spring, speed-limited per config (no overshoot); ±0.003-leg arrival tolerance (fractional scroll positions); routes re-planned on resize (debounced). `flight.ts` keeps only the journey maths; desktop / laptop / mobile configs.
- **Material:** pearl-silver chrome (`#f3f4f7`, roughness 0.045, clearcoat, iridescence 0.5). New studio: pearl sky over a darker floor with a white-tabletop bounce, one defined horizon ribbon, two warped sky ribbons, crisp rectangular softboxes (key, long top strip, right rim, low fill) and cyan/rose gels behind for a subtle iridescent rim. Proportions unchanged.
- **Intro hand-off:** the shader blends from its liquid studio into a matching "product studio" as the face forms (`shadeChrome(..., studio = u_face)`), so the crossfade lands on the new look.
- **Voice:** cached voice list (`voiceschanged`), speech primed inside the run / sound-toggle gesture (iOS Safari), `not-allowed`/errors recorded instead of silently failing, idle queue no longer cancelled (Safari), line requested at `face[0] + 60` to absorb engine latency.

### Validation (headless Chrome, SwiftShader)
- Journeys 1440/1024/390 (manual clock, 30 fps; normal, fast, reverse; full Work section): 0.0 px landing error at all 7 pauses per width; seated frames move exactly with the page; **0 frames** overlapping text/badges/buttons/media/nav at 1440; 1 frame each at 1024/390, only at the instant of a 9,600 px/s flick off the hero (his own fading caption / still glued under the menu button).
- Legs: 1440 route·route·route; 1024 route·tucked·hop; 390 route·hop·hop.
- Voice (scripted speechSynthesis with latency and boundary events): ranked natural voice chosen from the late-loading list; mouth opens only between engine start and end (0.37–0.78); caption reveals as audio starts; sound off → no speech and no priming.
- Flows: single canvas, menu flight, resize re-seat, reduced motion and no-WebGL fallbacks, no console errors. Production bundle: 0 debug strings. Intro hand-off mean difference 13.3/255 (was 10.7; mostly the existing card↔3D geometry offset).

## Checkpoint — 2026-11-12 (M3 refinement, awaiting review)
- **Milestone:** M3 + refinement on `m3-buddy-character`, **uncommitted**, not pushed. `main`, `m1-visual-foundation`, `m2-introduction` untouched.
- **Build/test:** typecheck ✓ · build ✓ (main 89 kB gzip + lazy three chunk 137 kB) · journeys ✓ · voice sync (mock) ✓ · flows ✓.
- **Known issues:** GPU frame rate and real-device scroll feel unverified (no GPU in sandbox) · real TTS audio unheard (no voices in sandbox; Chrome/Safari need a prior gesture — the intro run provides it, a returning visitor with saved sound who scrolls without clicking gets the caption only) · mobile flights are hops (no gutter at 390) · intro→3D hand-off ≈13/255.
- **Exact next task:** owner reviews recordings; on a real device check the voice and scroll feel; on approval commit `feat(m3): …` and push `m3-buddy-character`.

## 2026-11-13 — M3 refinement: visible mobile and laptop flights

### What changed
- **No more hops.** The planner may now use an off-screen band just past each side edge (`RouteOptions.offstage`), at extra cost so on-screen corridors always win. Where text spans the full width (390 px: 20 px margins), Buddy flies out along the seat row, runs down just past the screen edge, and sweeps back in across the empty row into the next seat — continuous and scroll-linked, never over content.
- **Scale tiers:** fully visible route at 100 % → 80 % → 70 %; otherwise the edge corridor at 80 %. The 55 % tucked route is gone (minimum flight size now 58 px at 1024/390).
- **Visibility-aware timing** (`retime`): stretches off screen both when a leg starts and when it ends are flown at 15 % of their length, so the leg's time goes to the part you can see. The path itself is unchanged.
- Mobile routes bias right (`rightBias 0.6`) so the visible approach crosses the whole seat row instead of a short left-edge entry.

### Validation (manual clock, 30 fps)
- 390: hero→About fully visible; About→Work visible 15/30 frames (curved sweep in from the right), Work→Contact 13/30; reverse 20/42. 0 content overlap (1 frame at a 9,600 px/s flick, still glued under the menu button). 0.0 px landing at all 7 pauses.
- 1024: About→Work at 80 % via the left margin (visible 22/25; the 60 px gap between the About columns cannot hold even a 70 % Buddy with clearance); Work→Contact at 80 % via the right edge. 0.0 px landings; 1 frame touching his own fading caption during the extreme flick.
- 1440 unchanged (all routes on screen at full size; 0 overlap).
- Planning cost: ~40–47 ms total per load/resize (debounced, sandbox CPU); per-frame cost unchanged.
- Flows: voice, single canvas, menu, resize, reduced motion, no-WebGL ✓. Typecheck ✓ · build ✓ (lazy chunk 137.7 kB gzip) · 0 debug strings in production.

## Checkpoint — 2026-11-13 (M3 final refinement, awaiting approval)
- **Branch:** `m3-buddy-character` @ `5899c1d` + uncommitted M3 work. Not pushed; M4 not started.
- **Known issues:** GPU frame rate and real-device scroll feel unverified · real TTS audio unheard in sandbox · on mobile the middle of each long flight is off screen (the long-section rule plus 20 px margins; see DECISIONS).
- **Exact next task:** owner reviews the 390/1024 recordings; on approval commit `feat(m3): …` and push `m3-buddy-character`.

## Checkpoint — 2026-11-13 (M3 committed and pushed)
- **Milestone:** M3 approved by owner, committed and pushed. M4 not started.
- **Branch / commit:** `m3-buddy-character` @ `78fc956` (from `5899c1d`). `main`, `m1-visual-foundation`, `m2-introduction` untouched; nothing merged.
- **Deployment:** Vercel commit status **success** ("Deployment has completed").
  - Inspect: https://vercel.com/deepak-2630s-projects/deepak-reddys-buddy-portfolio/2dGGWw5B63EASXaw8QG87yrzwZaJ
  - Preview is behind Vercel Deployment Protection (as in M2); rendered output on the preview not verified from the sandbox.
- **Known issues:** GPU frame rate, real-device scroll feel and real TTS audio unverified (sandbox: software rendering, no voices) · mobile mid-flight runs just off screen (20 px margins).
- **Exact next task:** owner checks the preview on real devices; then plan M4 (homepage storytelling and interactive project carousel) for approval.


## 2026-11-13 — Adam Perlis 2026 rebuild: first implementation pass

### Source basis
- Re-read the current live site and the complete “How I built this” article.
- The article's central design rules are now explicit: white space over cards, one floating pill control, light grey screenshot mats, one primary action per screen, one liquid/chrome material travelling through the story, and Buddy as a guide who occupies reserved seats rather than a chat widget.
- The home page's work experience is a carousel; project pages must show actual product evidence. The showreel is a later frame-deterministic HTML/CSS scene render, not a screen recording.
- This implementation stays on the React/Vite M3 base rather than migrating to Astro only for stack similarity.

### Implemented
- Replaced the separate floating circular controls with one compact top-right pill containing Home, Sound and Menu; when the menu opens it moves inward to the sheet's safe margin.
- Replaced the generic two-column project list with a horizontally scrollable carousel. It supports native touch/trackpad scrolling, keyboard focus, previous/next controls, centered snapping and a three-copy loop with re-basing at the boundaries.
- Added six original CSS/HTML interface studies, one per verified project: BMS lifecycle ledger, LotLens investigation, SentinelLog activity console, Phishing Shield message analysis, CampusCopilot terminal/map, and Clara & Co storefront.
- The project artwork is clearly identified as an original interface concept, not a screenshot of a deployed app. No Adam Perlis assets, logos, fonts or product imagery were copied.
- Corrected the Clara & Co repository link to the verified clara-co URL and refined team-project context to avoid solo-work attribution.

### Validation still required
- Run npm run typecheck and npm run build on the branch.
- Review the Vercel branch preview at desktop and phone widths; carousel wrap, menu position and 3D Buddy flight must be checked together.
- Real UI captures from the actual projects and a deterministic code-built reel are later tasks; current interface studies are visual placeholders for the carousel structure, not final product captures.


## 2026-11-13 — Paper Liquid Metal on the terminal

### Reference basis
- Read the current Paper Liquid Metal documentation and the published React implementation. The API exposes shape="none" for a full-canvas material layer, plus controls for repetition, softness, chromatic shifts, distortion, contour, angle, speed and scale.
- Pinned @paper-design/shaders-react to 0.0.82 (and its @paper-design/shaders dependency to the same version). Paper explicitly recommends pinning because breaking changes may ship under 0.0.x.
- Paper Shaders is Apache-2.0; its LICENSE and NOTICE are included under THIRD_PARTY_LICENSES/.

### Implemented
- Replaced the dark static terminal backing with the official Paper Liquid Metal shader running across the terminal window.
- Kept terminal text in the DOM, above the canvas, so it remains crisp, selectable and accessible.
- Tuned the neutral silver palette, mild chromatic separation, moderate distortion and slower motion for a restrained chrome surface.
- The existing M3 intro timeline still takes over at Run and morphs into the 3D Buddy, avoiding a second replacement of that carefully timed transition in this first pass.
- This change adds one temporary WebGL2 shader canvas while the intro is displayed. It is removed with the intro; the existing Buddy renderer and intro morph renderer are unchanged.

### Validation
- Vercel build and preview are the next checks. Confirm Paper's WebGL2 canvas initializes, terminal text remains legible, and the existing Run hand-off completes without a blank frame.
- Buddy's persistent 3D material is still the original Three.js reflective chrome model. The Paper shader is now driving the terminal surface; applying the same effect to the 3D head is a separate follow-up because Paper's documented React component renders a 2D canvas mask, while Buddy is a live Three.js mesh.


## 2026-11-13 — Paper Liquid Metal on Buddy's skin

- Added a transparent pebble mask for Buddy and render it with the same pinned Paper Liquid Metal shader used by the terminal.
- Layered the shader skin beneath the existing Three.js eyes and mouth. The Three.js body mesh is hidden only after the Paper canvas is detected; the original physical body is restored if the Paper canvas is unavailable or its stage is disposed.
- The Paper skin tracks the director's CSS-pixel position and size, with a light bank/stretch/bob transform. The existing 3D face remains responsible for gaze, blink, speech mouth movement, expressions and scroll/menu flight.
- This introduces a persistent Paper WebGL2 canvas alongside the existing Three.js canvas after the intro. It is one additional context; Paper is mounted at the small, fixed material dimensions rather than full viewport dimensions.

### Validation still required
- Check that the SVG mask is transparent outside the Buddy silhouette, Paper's canvas initializes in supported browsers, and the eyes/mouth layer stays registered while Buddy moves.
- Test loss of the Paper context: the physical Three.js body should reappear, leaving Buddy visible.
- Test mobile and reduced-motion paths. Reduced-motion continues to use the existing static placeholders and does not mount either Buddy shader.

## 2026-11-13 — Remove Paper shader backing rectangles

- Root cause confirmed in the Paper Liquid Metal fragment shader: the alpha channel of `u_colorBack` controls opacity in transparent portions of an image mask. An opaque `#AAAAAC` therefore filled the entire Buddy shader canvas behind the silhouette.
- Changed Buddy's `colorBack` to `#AAAAAC00` so the Liquid Metal mask is transparent outside Buddy's SVG silhouette.
- Changed the terminal's full-canvas `shape="none"` scale from `0.72` to `1`, matching Paper's published full-screen preset and removing the inset material viewport inside the outer terminal window.
- Set the Buddy material scale to `1` so its stripes/pattern fill the masked body rather than appearing unnecessarily zoomed out.
## 2026-11-13 — Terminal-to-Buddy morph: stay in place, form the face

### Cause found
- The intro timeline interpolated the object's centre from the terminal window to the hero Buddy seat between 1000 and 2350 ms. This created vertical travel while the body morphed, so Buddy appeared to move rather than be the terminal itself.
- The body size and face used `easeOutBack`, which adds overshoot. This made the liquid body and face features pop/spring instead of settling like one solid gallium drop.
- The shader unioned three satellite droplets into the body silhouette, which weakened the sense of one cohesive metallic volume.
- The CSS placeholder had an independent `float` keyframe that translated it vertically; this is removed so Buddy has one motion owner.
- The last-resort section-flight hop also contained a vertical offset. It now dissolves at fixed seat coordinates without a vertical nudge.

### Changes
- Align the terminal window over the hero Buddy seat before the first paint and keep that alignment on resize. The morph starts at the final Buddy centre.
- Remove centre interpolation: the rectangle changes into a pebble in place. The terminal window remains the anchor through the morph and hand-off.
- Replace overshooting easing with non-overshooting cubic easing for body size and eyes. The mouth has its own later `u_smile` uniform so the eyes form first and the smile follows.
- Remove detached satellite droplets and reduce surface displacement to subtle surface tension, keeping one solid, slowly settling liquid-metal body.
- Remove the placeholder's independent float and the hop's vertical pop. Existing menu/section flight remains director-controlled.
- Update the morph radius to match the 22px terminal corner radius.

### Validation
- Run a clean Vercel typecheck/build and verify the intro shader hand-off in a browser at desktop and mobile widths.
- Confirm the first frame of the persistent Buddy matches the morph's final hero-seat centre and silhouette.
## 2026-11-13 — Intro shader readiness and hand-off audit

### Root cause fixed
- The previous code selected its terminal-hide CSS from the generic `webgl` capability flag (`handedOff && webgl`) rather than the actual `useShader` result. If the WebGL context existed but the Liquid Chrome stage had not initialised (or the hero slot/stage was missing), the fallback timeline could hide the terminal without a shader being drawn.
- There was no readiness handshake: Enter was accepted before `LiquidScene` had necessarily compiled and warmed the exact fragment shader.
- A separate `supportsWebGL()` probe created an additional WebGL context even though the actual stage constructor already performs the definitive test.

### Changes
- Removed the redundant WebGL probe. The actual `ShaderStage` constructor is now the source of truth for availability.
- `LiquidScene` reports ready only after shader construction and a successful warm-up draw; compile/warm-up failures are logged and switch to the fallback path.
- If Enter is pressed before the shader is ready, the user's action is queued and replayed after the stage becomes ready. If initialisation fails, it replays through the explicit fallback instead.
- The terminal now hides only when `shaderTransition` is true; when the actual shader is not active, the dedicated fallback exit is used, so no blank transition is possible.
- Explicit stacking order puts the intro shader canvas above the terminal while keeping its initial alpha at zero.

### Validation still required
- Vercel typecheck/production build and a real browser check of the WebGL context, compile status and terminal-to-Buddy hand-off.
## 2026-11-13 — Fix the legacy Buddy hand-off that overlaid the morph

### Root cause confirmed in the current branch
- `IntroSequence` changes `document.documentElement.dataset.intro` from `leaving` to `handoff` at the start of the final 280 ms shader fade (`3400–3680 ms`).
- The hero seat CSS and BuddyStage CSS only hid their DOM/Three.js/Paper layers for `playing` and `leaving`, not `handoff`. At the exact moment the morph began fading, the placeholder and persistent Buddy renderer were therefore allowed to appear underneath/over the morph.
- `BuddyDirector.introPlaying()` also returned false for `handoff`, so its MutationObserver woke the persistent renderer during that same fade. This was the stale legacy path that made Buddy reappear before the morph had finished.
- A second path skipped the morph completely when `prefers-reduced-motion: reduce` was true: `run()` immediately called `finish('done')`.

### Changes
- Keep the hero placeholder, Paper skin and Three.js canvas hidden for every non-null `data-intro` state, including `handoff`. The intro shader is the only visible Buddy until the final frame.
- Keep `BuddyDirector` dormant through `handoff`; it wakes only after the intro removes `data-intro` at completion.
- End the timeline on the exact frame the shader's hand-off alpha reaches zero (`done=3680`, matching `handoff[1]`).
- Do not silently skip the morph on an explicit Run click when reduced motion is enabled. The same shape transformation still plays, but surface agitation, breathing and blink are suppressed.

### Validation
- Vercel production build and deployment required. Browser-level visual verification remains necessary to validate the final crossfade on the user's device.
## 2026-11-13 — Prevent Paper Buddy skin from revealing at its staging coordinates

- The Paper skin is initially parked off-screen at `translate3d(-1200px, -1200px, 0)`. Its MutationObserver previously set opacity to 1 as soon as the shader canvas appeared, even when the director had not yet supplied a measured seat. It now stays hidden until a valid position and size exist; the first placement is applied before reveal.
- `BuddyRenderer.place()` previously called `positionPaperSkin()` with a neutral pose every tick, immediately overriding the current bank/stretch/bob written by `update()`. It now reuses the last director pose so the Paper chrome body stays aligned with the Three.js face.
- This closes the last staging-position/pose reset path involved in the persistent Buddy reveal after the morph.
## 2026-11-13 — Fix the invisible Liquid Chrome render

### Root cause found
- The procedural chrome environment called `smoothstep(-0.15, -0.7, y)` in `studioBuddy()`. GLSL defines output as undefined when `edge0 >= edge1`. This helper is evaluated by `shadeChrome()` from the first morph frame, including when the studio blend weight is zero, allowing invalid values to propagate into the metallic output.
- The previous warm-up compiled the shader and drew only with `u_alpha=0`; it never verified the GPU returned visible pixels.
- The terminal was hidden at the timeline swap mark before verifying that the morph canvas had drawn its first visible frame.
- A runtime draw exception called `finish('done')`, which removed the intro and revealed Buddy immediately.

### Changes
- Replaced the reversed floor gradient with `1.0 - smoothstep(-0.7, -0.15, y)`.
- Added `ShaderStage.readPixelCss()` and a visible pixel readback in LiquidScene warm-up. Readiness now means the GPU has rendered a non-transparent, non-black metallic pixel.
- Kept the morph canvas hidden during warm-up and made it visible only during the actual transition.
- Removed the silent no-shader fallback that hid the terminal and revealed Buddy. If the shader fails, the terminal stays visible with the actual diagnostic reason.
- The terminal only hands over after the first visible shader frame has drawn; runtime draw errors restore the terminal instead of completing the intro.

### External reference
- GLSL `smoothstep` requires `edge0 < edge1`; results are undefined otherwise: https://docs.gl/el3/smoothstep

### Validation
- Vercel production build and runtime pixel-readback check are required.
## 2026-11-13 — Reduce intro GPU contexts and expose actual shader diagnostics

### Likely cause of `Shader compile failed: unknown error`
- The previous compile helper used `getShaderInfoLog(shader) ?? 'unknown error'`. WebGL specifies that queries such as `getShaderInfoLog()` return null while a context is lost. Therefore the exact `unknown error` string is consistent with a context lost during compilation, not proof of malformed GLSL.
- The app was mounting Buddy's Paper Liquid Metal canvas and Three.js renderer at the same time as the terminal's Paper canvas and the intro's custom WebGL canvas. The Buddy renderers were hidden by CSS, but their GPU contexts were still allocated.
- Khronos documents GPU resource contention/context loss and recommends checking `isContextLost()` before reading shader/program logs. References: https://wikis.khronos.org/webgl/HandlingContextLost and https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/isContextLost

### Changes
- AppShell now passes `intro.active` to BuddyStage. During the intro, BuddyStage preloads only the JS module (no renderer/context) and does not mount the Paper Buddy skin or Three.js canvas. Those contexts are created after the intro ends.
- This reduces the intro from four simultaneously allocated WebGL canvases (terminal Paper, Buddy Paper, Buddy Three.js, custom morph) to the two needed for the actual intro (terminal Paper + custom morph).
- ShaderStage now attaches its context-lost listener before compiling either shader.
- Compile diagnostics distinguish a lost WebGL context from a real compiler error. Real compiler errors include the shader stage, info log, GL/GLSL versions and numbered source context. Shader objects are cleaned up on partial failure.

### Validation
- Vercel build and browser runtime test required. If this error persists, the new message will identify either `CONTEXT_LOST_WEBGL` or the exact compiler log/source line instead of `unknown error`.

## 2026-11-15 — Buddy chrome hand-off, scale and face refinement

### Source of the visual mismatch
- The pale Buddy seen at the end of the intro was not the CSS legacy placeholder. It was the intro's custom liquid-chrome fragment shader; after the intro it was replaced by the persistent Paper Liquid Metal skin. The two materials produced visibly different finishes.
- The persistent Paper skin was held behind the intro state, while the Buddy director stayed dormant through `handoff`, so the live face renderer could not participate in a deliberate final cross-fade.

### Changes
- The warmed Paper skin and live face canvas now fade in during the intro's existing final hand-off window while the intro shader fades out. The intro face fades with the same progress, avoiding doubled eyes or mouth.
- Buddy's director now wakes during `handoff` so it can draw the already-measured hero pose before the intro overlay is removed.
- The hero seat is reduced to 132–152 px on desktop and 104–120 px on small screens; inline seats remain unchanged.
- The persistent Three.js face now includes a distinct glossy nose and a larger complete U-shaped smile, with a separate speech-opening shape.
- The intro shader draws the nose and a wider smile so the facial design stays consistent during the morph.
- The static fallback was changed from the legacy pale placeholder to a chrome-toned interpretation with iridescent ribbons, nose and a complete smile.

### Validation
- Source-level changes are grouped in one commit on `adamperlis-current-rebuild`.
- Browser/GPU rendering, the intro-to-Paper cross-fade, and `npm run typecheck` / `npm run build` still require verification in the owner's local browser environment.


## 2026-11-15 — Match the approved Buddy artwork

### Visual review findings
- The first post-handoff recording showed the Paper Metal bands sweeping across the body into a much darker look than the supplied reference.
- The procedural face was proportioned incorrectly: the eyes were too small and too symmetrical, the reflective nose sat too high, and the wide U-shaped mouth crowded the centre of the face.

### Changes
- Added the owner's approved Buddy image as `public/buddy-reference.webp` with a transparent background. The settled character and reduced-motion fallback now use this exact artwork.
- Kept the existing director's seat measurement, flight path, scale and contextual positioning; the exact sprite is moved and tilted through the same reserved seats.
- Reduced the hero seat to 110–132 px on desktop and 92–108 px on mobile.
- Kept a Three.js fallback if the image fails to load, but hide its output when the canonical artwork is ready.
- Refined the fallback face and intro shader coordinates: larger asymmetrical eyes, a flat oval nose lower on the face, and a small curved smile line.
- The Paper Liquid Metal shader remains part of the terminal/intro experience; it no longer changes the settled Buddy's approved material pattern.

### Validation
- Production build must pass after the asset and renderer changes.
- Verify desktop at 1024 px and a wide viewport; check the exact image hand-off, sprite-to-seat alignment, and that no duplicated fallback face appears.
- Verify mobile, reduced motion, and missing-image fallback.


## 2026-11-15 — Restore the live Liquid Metal Buddy

### Review finding
- The preceding revision used `buddy-reference.webp` as the settled character. This made Buddy a static image and removed the live metallic surface animation. That was incorrect for the requested experience.

### Changes
- Restored Paper's `LiquidMetal` component as the actual Buddy body renderer, with the supplied silhouette used only as a transparent mask.
- Added independent SVG face layers for the eyes, highlights, small oval nose and complete curved smile; the eyes blink and the mouth reacts to the renderer's speech envelope.
- Kept the face and shader inside the same positioned element so the existing Buddy director still moves, tilts and scales the whole character between sections.
- Removed the static reference image from both the normal renderer and the loading/reduced-motion placeholder.
- Kept the existing intro transition and terminal choreography unchanged.

### Validation
- Paper documents the `image` prop as a transparent effect mask and `speed` as the animation-loop control.
- Production build and Vercel preview must pass. Owner visual check is still required for chrome motion, face alignment, and 1024 px scale.


## 2026-11-15 — Fix opaque rectangular shader background

### Root cause
- Paper's `colorBack="#a7aab2"` was an opaque background color. The LiquidMetal renderer correctly created a rectangular canvas, but the background color filled the entire canvas outside the Buddy silhouette. This produced the visible grey square/tile seen in the latest recording.
- The mask was also a hand-drawn approximation despite the repository already containing the user's transparent Buddy artwork.

### Fix
- Use the alpha channel of the supplied transparent Buddy artwork (`/buddy-reference.webp`) as the LiquidMetal effect mask.
- Set `colorBack` to fully transparent (`#a7aab200`) and explicitly keep the shader container/canvas backgrounds transparent.
- Leave the shader speed, face layers, intro transition timing, Buddy director, and target scale unchanged.

### Validation
- Confirmed Paper documents `image` as an effect mask requiring a transparent background and `colorBack` as the background color.
- Production build and visual check at 1024 px still required.


## 2026-11-16 — Step 1: terminal becomes a small chrome Buddy; one renderer

### Owner direction
- Keep the glossy chrome terminal and Enter-to-run. After the commands load, the terminal itself becomes Buddy.
- Buddy: chrome body, elliptical eyes with a small white pupil, a smile, no nose. Small (Adam Perlis scale), never a large rounded object.
- No legacy Buddies (white, flying in, placeholders). Buddy blinks, looks around and follows the pointer.

### Root causes found
- The intro used its own shader Buddy: after Run it showed a dark rectangle, a flat grey slab, then a terminal-sized rounded pebble that shrank into a pale pearl Buddy, swapped at the end for the Paper Buddy (different material and face).
- Four Buddy renderers existed (intro shader, Paper skin, hidden Three.js model, CSS placeholder in every seat). The placeholder appeared whenever `html[data-buddy]` was not `'3d'`: on load, on effect cleanup and on any fallback.
- The mask was cropped flat on all four edges and had stray alpha pixels (clipped, speckled Buddy).
- Gaze/blink/expressions drove the invisible Three.js model. The director's timers used the frame loop's clock, which pauses while the director sleeps, so a 3 s blink interval stretched to about a minute.

### Changes
- One Buddy: `PaperBuddyView` (Paper Liquid Metal body on a cleaned mask + SVG face), lifecycle in `buddyHost` (`loading` / `live` / `unavailable`). Seats are reserved space only; no placeholder exists.
- Intro: Run → commands load (~1.5 s) → Buddy's chrome surface takes over the terminal's exact box, shrinks while still rectangular, rounds into his silhouette once small → face appears → looks around, blinks → page appears; the director continues from the same pixel. If the renderer is not live, the terminal recedes and the page appears.
- Face: elliptical eyes with one small white pupil and a smile; no nose. Pointer-following, idle glances and blinks driven by the director on wall-clock time.
- Removed: Three.js Buddy, `BuddyPlaceholder`, the intro morph shader (`LiquidScene`, `liquidChrome.frag`, `introTimeline`, `introDebug`), `lib/webgl`. Dependencies: removed `three`, `@types/three`; added `@paper-design/shaders@0.0.82` explicitly (already installed via `@paper-design/shaders-react`, still used by the terminal).
- The terminal renders its Paper surface only where WebGL2 exists (no uncaught error otherwise).

### Validation (headless Chrome, software WebGL)
- Typecheck and build pass. One canvas in every state; no placeholder at load.
- Intro at 1024 px: canvas box 424 → 244 → 163 → 142 px wide (body 110 px), never a large round shape; director takes over at the same position.
- Idle: 3 blinks and 2 glances in 12 s. Reduced motion, no WebGL, context loss/restore, skip mid-morph, scroll to About, menu, Strict Mode dev server checked. Owner review on real hardware pending.

## 2026-11-16 — Adam-style terminal, design face, Buddy's introduction with voice

### Owner feedback addressed
1. Buddy sat frozen on the page during the intro (replay mid-page): the page Buddy is now concealed when any intro starts, and the terminal's chrome surface *is* Buddy from the first frame.
2. Terminal and Buddy designs: the terminal is now a near-square glossy chrome slab with the Run bar inside it (owner's reference); Buddy's face follows the owner's design (elliptical eyes with highlight + glint, small smile under the eyes, no nose) and his material is bright striped silver.
3. "Coming from the bottom" after the transition: the director kept its pre-intro journey state and flew from the old seat. It now snaps to the current scroll position when the intro hands over.
4. Introduction: after the morph Buddy says "Hey, I'm Buddy!" + a joke; the profile pops up (photo/monogram + "I'm Deepak. I'm a software developer.", bio bottom-left, stats bottom-right) and he says "This is Deepak. He built me." + a joke. Captions follow each line.

### Changes
- Voice: lines generated offline with Kokoro (open source, voice `am_puck`) — `public/buddy/voice/*.mp3`, `src/content/buddyLines.ts`, `scripts/generate-buddy-voice.py`. `buddyVoice.playLine` plays them (sound on) or runs them silently (sound off); a loudness envelope drives the mouth either way.
- One renderer for terminal and Buddy: the terminal slab is Buddy's Liquid Metal (soft dark "terminal look" blending into the bright "Buddy look" as he forms). `@paper-design/shaders-react` removed; only `@paper-design/shaders` remains.
- Hero: profile (`src/content/profile.ts`, from confirmed facts; photo slot uses the monogram until a photo is set), `buddySpeech` caption store, resting hero line "This is Deepak. He built me."
- Intro layering: white field → Buddy → terminal text/controls; Skip stays available while Buddy talks.

### Validation
- Typecheck and build pass. Headless Chrome: terminal 400 px → Buddy 110 px body, page reveal, four lines with captions, profile pop-up, handover at the same position; replay from the About seat (no stale Buddy; terminal drawn by Buddy's surface); skip lands in the hero seat; reduced motion, no WebGL, context loss/restore, menu and Strict Mode dev checked. Voice audio and real-GPU look need the owner's review.

## 2026-11-16 — Joke pools, profile top-left (greyed until introduced), navbar top-centre, voice

### Changes
- Jokes: `scripts/buddy-lines.json` holds every line and caption — 8 jokes about Buddy and 8 about Deepak. Each visit picks one of each (`buddyScript.pickLine`), never the one that visitor heard last time.
- Profile at the top-left; the navbar alone at the top centre (tablet/phone: the profile sits below the navbar). During the intro the profile, bio and stats show greyed; when Buddy turns to introduce Deepak they pop to full colour.
- Buddy looks around for about two seconds after forming, then speaks.
- Voice: Adam Perlis's write-up says his Buddy used **Speechify** (recorded ahead with word timings, a flat deadpan take, "a bit faster"); it does not confirm the voice name. `scripts/generate-buddy-voice.py` now supports `--provider speechify --voice <id>` (owner's API key; the build sandbox cannot reach api.speechify.ai — the egress proxy returns 403). The shipped audio is regenerated with Kokoro (`am_puck`, rate 1.1) until then.

### Validation
- Typecheck and build pass. Headless Chrome: full intro with pooled jokes, greyed profile popping on cue, navbar/profile/bio/stats without overlap at 1280, 820 and 390 px; reduced motion, no WebGL, context loss/restore, menu and Strict Mode dev unchanged.

## Buddy polish: pace, gaze, mouth, profile spot

- **Speech pace:** voice lines play at 0.9× (`SPEECH_RATE` in `src/lib/voice/voice.ts`, pitch preserved). Captions, mouth envelope and script timing all scale with it.
- **Looking around:** after the terminal morph Buddy does a ~2.5 s look-around (left, up-right, right, down-left, back) using both eyes and head. The head turns, leans and tilts with gaze in `PaperBuddyView.applyTransform`, and the eye travel is larger. Idle glances in `BuddyDirector` now vary direction and sometimes double-take.
- **Introducing Deepak:** Buddy looks at the profile photo as it pops in, then at the name tag partway through "This is Deepak…", then back to the visitor (`lookToward` + `data-profile-part` targets).
- **Mouth:** the smile is now one filled shape whose lower lip opens with the voice envelope (smoothed attack/release), replacing the separate ellipse.
- **Profile position:** moved lower and slightly inward (`top: clamp(88px, 15vh, 156px)`), photo 60px; tablet and mobile rules updated.
- QA: reduced motion, no WebGL, context loss/restore, About seat, menu, Strict Mode dev, idle blinks/glances and layout at 1280/820/390 all pass.

## Buddy pacing: jokes and Deepak intro

- Jokes and the Deepak lines play at 0.65× (intro lines stay at 0.9×); was 0.86×.
- Buddy now holds a beat at punctuation: ~380 ms after a sentence, ~460 ms on "...", ~170 ms at a comma or colon. Each mark's position is mapped onto the recording and snapped to a real silence in the envelope; the audio pauses and the mouth closes during the beat. The same clock drives silent (sound-off) playback.
- Longer gaps between lines (after "Hey, I'm Buddy!", before turning to Deepak, before the Deepak joke). The look at the name tag now lands on the beat before "He built me."
- Measured: self joke ~3.1 s → ~3.75 s, Deepak joke ~4.2 s → ~5.0 s.

## Adam-style hero choreography and a turning 3D head

Reference: the owner's screen recording of adamperlis.com (intro → hero).

- **Head that turns:** Buddy's face is painted on a sphere (`projectOnHead` in `PaperBuddyView`). Turning slides the eyes and mouth across the body, foreshortens them near the edge and hides them round the back, clipped to the head. Head angles follow the gaze on an under-damped spring (yaw ±57°, pitch ±36°); the eyes lead slightly and the head catches up. The chrome reflections swing with the turn (`u_angle`).
- **Pointer:** when seated he turns his whole head towards the pointer (full turn when far, gentler when close) for 9 s after it last moved, then goes back to idle glances. With the pointer on him he squints happily (`delighted`).
- **Wake-up and mouth:** his eyes appear closed during the face reveal and open. Talking, the smile rounds into a small open "o" whose height follows the voice; closed, it is the smile again.
- **Choreography:** the terminal becomes Buddy in the middle of the screen (`[data-intro-slot]`), and he talks there with a karaoke caption below him (`SpokenLine`: grey words turn ink as they are spoken). When he introduces Deepak, the profile (top-left) and the navbar pop in, and he turns right round to look at the photo, then the tag. After the joke he turns away and flies in an arc to his corner (top-right, line to his left). The bio and stats come in (`html[data-details]`), the stats stagger and numbers count up, and his resting line writes itself in.
- **Hero layout:** profile is photo plus "Hello, I'm Deepak. / I'm a software developer." with no pill. The bio has a chrome Contact pill (its highlight follows the pointer) and "See the work →". The centre of the hero is left open for a future feature.
- QA: regression suite passes (reduced motion, no WebGL, context loss/restore, About seat, menu, Strict Mode dev, idle blinks/glances); no layout overlaps at 1280/1920/820/390.

## Buddy's personalities (outfits) and situational lines

Reference: the owner's recording of adamperlis.com (clicking Buddy).

- **Outfits on click:** clicking Buddy (wherever he is seated, except the menu) cycles: none → black tie (top hat + bow tie) → shades & headphones → hard hat → none. He twirls a full turn (0.9 s); the outfit swaps while his back is turned and pops in as he faces you again, then he says its line. The outfit stays on as he moves around the page. The pointer becomes a hand over him. Pieces are SVG (`buddyAccessories.ts`) and follow the turning head: hats lean and shift, the bow tie turns with the front of the body, the far headphone cup disappears behind him, and the sunglasses replace his eyes and foreshorten with them.
- **"Oh! You're back!":** after the tab or window has been away for 20 s or more, his eyes are shut when you return; after a beat they open and he denies napping.
- **"Ahem. The page keeps going.":** once per visit, after a minute on the home screen (the clock starts when the intro ends or when he arrives at the hero).
- Lines live in `src/content/buddyQuips.ts` and in `scripts/buddy-lines.json` (group `quip`), so recordings can be generated. Until a recording exists, a line runs on a silent synthetic timeline: the mouth moves and the karaoke caption darkens in step, with no sound. A line replaces the seat's resting line until he leaves that seat.

## Hard hat redesign; clean voice (no browser time-stretch)

- **Hard hat:** rebuilt as a glossy construction helmet: a rounded dome sitting down on the head, a centre rib with a knob, a gloss highlight, and a thick brim that wraps round the head and dips at the front. Hats now ride with the head like a point on the forehead: a damped sideways shift, and full rise and fall with his gaze. Looking up, the brim rises at least as far as his eyes, so it never slides over them.
- **Voice:** the robotic sound came from slowing recordings in the browser (`playbackRate` 0.65 with pitch preserved time-stretches the audio). Playback is now 1× for every line, and pace is set where the lines are generated:
  - `--rate`: intro lines, default 1.0.
  - `--joke-rate`: jokes, Deepak lines and quips, default 0.88.
  - Real SSML pauses (`<break>`) go after sentences (`--pause`, default 320 ms), with a third of that after commas.
  - Text is escaped for SSML.
  - In-browser beats are reduced to small top-ups (160 ms at sentence ends, 240 ms at "...", none at commas).

## Hard hat matched to Adam's; slower voice defaults

- **Hard hat** redrawn to match the reference: a plain flat-yellow half dome, a thin lip of a brim and a small stalk on top, with no gloss or rib. It tips more as he turns (±14°).
- **Voice pace** slowed for clarity. Generator defaults are now `--rate 0.9` (intro), `--joke-rate 0.8` (jokes, Deepak lines, quips) and `--pause 420` ms after sentences. Synthetic (not yet recorded) lines also run at a slower, easier pace with longer sentence gaps.

## Voice: auto-paced to natural speech

- TTS voices read quickly. Kokoro measured 223 words per minute at rate 1.0 and still 176 at 0.8, while natural conversational speech is about 140–160 wpm. The right rate differs per voice and per line, so the generator now measures it.
- `generate-buddy-voice.py` generates each line, measures its pace (pauses included) and re-generates at an adjusted rate until it lands near `--target-wpm`. The default is 150, or about 160 for the intro lines, with at most three takes per line. It prints each line's wpm and the rate used. `--target-wpm 0` turns this off.
- `--preview [id|text] --voices … --rates …` auditions one line in several voices and rates into `voice-previews/` (gitignored), with a wpm readout. Site files are untouched.
- `--list-voices` (Speechify) lists the available English voices.
- Kokoro test: lines land at 144–164 wpm with rates of 0.62–0.91.
