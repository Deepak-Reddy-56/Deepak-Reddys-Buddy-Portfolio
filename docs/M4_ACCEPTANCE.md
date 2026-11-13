# M4 — Buddy interactivity and narration

Status: **M4.1 pushed; Vercel preview build READY. Owner device and voice review pending.**

## M4.1 — Interaction and narration foundation
- [x] One data-driven narration catalog in `src/content/buddyScripts.ts`.
- [x] Once-per-visit narration when About, Work and Contact become active.
- [x] Clickable, keyboard-accessible hero and section headings replay the matching line.
- [x] Clickable project names play concise repository-grounded summaries.
- [x] Tap/click Buddy to cycle through distinct expressions and contextual jokes.
- [x] New speech cancels the previous line; no overlapping narration.
- [x] Existing sound preference is respected; sound-off means no speech.
- [x] First pointer gesture primes browser speech for return visits.
- [x] Live captions for tap reactions and a keyboard-accessible Buddy interaction control.
- [x] One 3D model and one existing rendering context are retained.

## Owner checks
- [x] Vercel preview reports READY; the connected build command runs `tsc -b && vite build`.
- [ ] Spoken lines sound natural in desktop Chrome.
- [ ] Available system voices tested on iOS Safari / Android Chrome.
- [ ] Section narration timing and joke frequency approved.

## Later slices
- M4.2: voice selection UI, expression polish and project interaction feedback.
- M4.3: real-device voice review and speech/caption timing.
- M5: reference-layout parity — page composition, work presentation, section rhythm and responsive layouts.
