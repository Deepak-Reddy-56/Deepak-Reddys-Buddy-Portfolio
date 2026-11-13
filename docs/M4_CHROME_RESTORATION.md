# M4 chrome restoration

## Reference transition
- The original M2 sequence remains in the code: terminal → liquid-chrome transformation → rounded Buddy silhouette → eyes and mouth → page reveal → 3D Buddy handoff.
- The M2 timeline is unchanged from M3 and M4. Use `?intro` to force replay; otherwise the introduction runs once per browser profile.

## Material correction
- Replaced rectangular softbox reflections on the 3D Buddy with warped, flowing silver/black reflection ribbons.
- Added a restrained spectral/rainbow band based on the supplied reference clip.
- Mirrored the environment in the intro shader and Three.js environment to reduce the material discontinuity at handoff.

## Review checklist
- [ ] Vercel preview build succeeds.
- [ ] Forced intro replay shows the complete terminal-to-chrome-to-Buddy sequence.
- [ ] Final 3D Buddy has the flowing chrome finish from the reference.
- [ ] Owner reviews on desktop GPU and phone.


## Review outcome — 2026-11-13
The first M4 chrome environment experiment was rejected by the owner because the resulting transition was worse than Claude's prior M3 implementation. The two shared material files were restored exactly from `m3-buddy-character`. Keep the original M2 transition and prior M3 material as the baseline for the next dedicated transition pass.


## Transition sequencing correction — 2026-11-13
The terminal is the source object, not a prompt before a separate Buddy entrance. The shader now holds the exact terminal centre while changing its dimensions and geometry into the chrome pebble and revealing its face. Only after the Buddy form is visible does that same object move to the reserved hero seat. The final shader-to-3D handoff remains at hero-seat coordinates.


## Transition baseline restored — 2026-11-13
The attempted M4 centre-locked transition was removed. The approved Claude M3 transition is restored byte-for-byte in `introTimeline.ts`, `IntroSequence.tsx`, and `BuddySeat.module.css`. Its overlapping morph + travel + scale choreography is the transition baseline. M4's interaction and narration features remain layered on top of it.
