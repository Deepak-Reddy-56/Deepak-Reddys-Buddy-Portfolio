# M3 acceptance checklist — Buddy becomes a real 3D character

Status: **implemented and tested, awaiting owner review** (2026-11-12, branch `m3-buddy-character` from `5899c1d`, uncommitted).

## Character
- [x] Procedural 3D model (no external assets): pebble body with the M2 placeholder's proportions (1 : 0.84) and a fuller upper-left, glossy black eyes with highlights following the body's curvature, U-shaped mouth, open-mouth shape for talking, contact shadow.
- [x] Polished chrome: `MeshPhysicalMaterial` (metal, low roughness, clearcoat, thin-film iridescence) lit by a procedural studio environment (gradient + softboxes, PMREM-filtered; no HDRI, no network).
- [x] Expressions: idle, greeting, happy, curious, listening, thinking, flying — eased parameter sets (eye scale/height/lift, mouth width/curve, head tilt).
- [x] Natural blinking (2.5–6 s, occasional double blink), gaze (travel direction in flight, glance at the line on arrival, visitor or cursor when seated), idle bob that fades after 7.5 s.

## One persistent character, scroll-driven
- [x] One WebGL canvas, one character, fixed and click-through (`pointer-events: none`), above the page and menu sheet, below the controls.
- [x] Seats are DOM anchors (`BuddySeat` → `[data-buddy-seat] [data-buddy-slot]`) at the start of Hero, About (new), Work, Contact, plus the menu. Positions are measured, re-measured on resize / layout / font load.
- [x] Journey is a pure function of scroll (`flight.ts`): seated ⇒ glued to his seat; between seats ⇒ curved Bézier flight that lands exactly as the next seat reaches the arrival line. Reverses naturally when scrolling back.
- [x] Fast scroll / jumps / menu: speed-limited, critically-damped spring catch-up from wherever he is to the live target, then hands back to scroll-linked flight.
- [x] Body language: bank, pitch and yaw from velocity; anticipation crouch at take-off; squash-and-settle landing; shadow fades while flying; size eases between hero and section seats.
- [x] Dialogue appears only when he has landed and the visitor pauses (word-by-word), and fades when he leaves. Lines live in `src/content/dialogue.ts`.
- [x] He flies into the menu when it opens and back when it closes.

## Voice
- [x] "Hey, I'm Buddy!" spoken as his face appears in the intro, with the same line as the caption and an animated mouth (intro shader and 3D model).
- [x] Pluggable `VoiceProvider`; M3 uses the Web Speech API with a ranked, non-novelty English voice (pitch 1.15, rate 1.03). Respects the sound preference; only after the Run gesture; once per intro run (`sayOnce`); replay speaks again; skip cancels.
- [ ] Owner listening test on real browsers (voice quality is OS/browser dependent — see DECISIONS).

## Fallbacks and performance
- [x] Reduced motion: no 3D, static placeholder in each seat, captions visible.
- [x] WebGL unavailable / context lost: same static fallback, no errors.
- [x] three.js lazy-loaded in its own chunk (134 kB gzip); main bundle +2 kB.
- [x] Renders only Buddy's bounding box (scissor); sleeps when idle, waking only for blinks/scroll/pointer/menu.
- [x] All Buddy timers on one clock (FrameLoop); scroll, flight, face and dialogue in one tick.
- [x] Debug/QA hooks (`?buddyDebug`, `?manualClock`, `?introDebug`) are compile-time removed from production (0 matches).

## Validation (headless Chrome, SwiftShader — no GPU in the sandbox)
- [x] Frame-exact 30 fps journeys at 1440 / 1024 / 390 (manual clock): Hero → About → Work → Contact, back to Work, fast flick to top, fast flick to bottom.
- [x] Landing alignment: 0.0 px error at every pause, every width; correct seat after backwards and fast scrolls.
- [x] Seated frames move exactly with the page (0.0 px deviation); catch-up never exceeds its speed cap (no teleports).
- [x] Intro → 3D hand-off: same position, size, silhouette and brightness (225.2 vs 225.8); reflections differ in detail (mean diff ≈10.7/255).
- [x] Click-through, single canvas, menu flight, resize re-alignment, voice once/replay/sound-off, reduced motion, no-WebGL — all pass; no console errors.
- [ ] Real-GPU frame rate (use `npm run dev` → `/?buddyDebug`) and real-device scroll smoothness (iOS Safari / Android Chrome).

## Refinement pass (2026-11-12)
- [x] Long sections: Buddy scrolls out with his seat, reappears for the next section (no margin docking).
- [x] Whitespace-aware routes; 0 overlap frames with text, badges, buttons, media and nav at 1440 (1 frame at 1024/390, only during a 9,600 px/s flick off the hero).
- [x] No hops: edge-corridor flights (mobile, 1024 About→Work and Work→Contact) at 80 %; minimum flight size 70 %.
- [x] Pearl-silver chrome, rectangular softbox highlights, defined horizon, subtle iridescent rim; proportions unchanged.
- [x] Voice: one call per run, primed in the gesture, mouth driven only by real start/end events, caption in step (scripted engine).
- [ ] Owner: hear the voice on real devices (Chrome, Safari macOS/iOS, Android).
- [ ] Owner: check scroll feel and frame rate on real GPUs.
