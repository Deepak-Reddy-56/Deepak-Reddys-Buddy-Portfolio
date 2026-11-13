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
