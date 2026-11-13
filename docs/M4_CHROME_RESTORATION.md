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
