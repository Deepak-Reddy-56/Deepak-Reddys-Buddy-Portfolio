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
