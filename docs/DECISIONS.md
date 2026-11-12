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
