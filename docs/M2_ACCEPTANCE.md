# M2 acceptance checklist — the introduction

Status: **implemented and tested, awaiting owner review** (2026-11-12, branch `m2-introduction`, uncommitted).

## Experience
- [x] Scene A — terminal: dark-glass window, self-typing `deepak@portfolio:~$ ./start-buddy`, blinking cursor, "not a real terminal" comment, Run button, Enter runs (also from the sound switch), touch copy ("Tap Run to begin").
- [x] Scene B — liquid chrome: the *same box* is handed from DOM to shader, turns from glass to chrome, agitates, throws droplets and morphs.
- [x] Scene C — Buddy: the liquid settles into Buddy's pebble at the exact homepage seat, eyes pop in, blinks; material eases to the placeholder's pearl look; the homepage fades up around him; hero line reveals word by word; DOM Buddy crossfades in. One clock drives all of it (`introTimeline.marks`).
- [x] Skip intro (and Escape) ends immediately.
- [x] Replay: menu ("Replay the intro") and footer (`$ ./start-buddy`).
- [x] Not irritating: plays on first visit only; deep links (`#work`) skip it; `?intro` forces it.

## Sound
- [x] Synthesised with Web Audio (no files, no keys): key clicks, enter, startup swell, blip.
- [x] Never before a gesture; respects the saved preference (default off); silent no-op without Web Audio.
- [x] Header sound control is now functional and shares the same preference.

## Technical
- [x] No new dependencies (see DECISIONS: zero-dependency WebGL stage now; three.js / R3F decision deferred to M3).
- [x] `ShaderStage` (WebGL lifecycle, DPR cap 1.75 / 1.25 on small or touch screens, resize, context loss, disposal) + `FrameLoop` (rAF clock, capped delta, pauses when tab hidden).
- [x] Shader early-exits outside the object's bounds; renders only while the sequence runs; resources disposed on finish/skip/unmount.
- [x] Reduced motion: command shown instantly, Run goes straight to the page, Buddy's idle motion off.
- [x] No WebGL: terminal recedes, page fades up, DOM Buddy appears (tested with `--disable-webgl`).
- [x] Homepage reveal driven by `html[data-intro]` in CSS; M1 components only gained small, opt-in hooks.

## Validation (Playwright + Chrome, software GL)
- [x] 1440 / 1024 / 390: full sequence screenshots, home after intro, menu navigation after intro.
- [x] Enter (1440, 390) and Run button (1024) both execute.
- [x] Skip immediate; Escape skips; replay from footer and menu (scrolls to top); return visit shows no intro.
- [x] Sound: 7 synthesised voices during a run with sound on; 0 with default off; preference persists.
- [x] Reduced motion and WebGL-fallback paths complete.
- [x] No horizontal overflow; no app console errors (only Chrome's "GPU stall due to ReadPixels" from screenshot capture on software GL).
- [x] `npm run typecheck` ✓ · `npm run build` ✓ (JS 84 kB gzip, +8.4 kB for M2).
- [x] Refinement pass: seam-free continuous reflections; settled state reproduces the CSS placeholder (silhouette, gradients, inset shadows, sheen, rim, eyes, mouth, drop shadow) → hand-off mean pixel difference ≈1.6/255 at 1440/1024/390, brightness within 0.3.
- [x] Timeline sync: frame-accurate capture (Chrome virtual time, 30 fps) — Enter→homepage 3.6 s at every width; timeline 3564 ms vs clock 3567 ms; no frame jumps (largest per-frame change is the 8-frame glass→chrome swap).
- [x] No-WebGL never blank: every frame has visible content (min 3 % non-white); GPU failure or context loss mid-run reveals the page immediately.
- [x] Sound measured from the actual output stream: toggle + 13 key clicks, enter, startup swell, reveal blip; silent by default; no AudioContext before a gesture even with 'on' saved.
- [x] Pre-commit checks (performance, sound, debug isolation) — see BUILD_LOG "M2 pre-commit checks".
- [ ] Hardware-GPU check by owner: `npm run dev` → `/?intro&introDebug` shows real frame times (fps, worst frame, slow frames, wall vs timeline). The sandbox has no GPU.
- [ ] Owner review of pacing, copy and sound character.
