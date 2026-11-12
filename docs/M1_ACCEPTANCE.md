# M1 acceptance checklist — visual foundation

Status: **implemented and tested, awaiting owner review** (2026-11-12, branch `m1-visual-foundation`).

## Build and architecture
- [x] TypeScript build fixed (`src/vite-env.d.ts`, typed `VITE_*` env vars).
- [x] `npm run typecheck` passes with strict settings.
- [x] `npm run build` passes (JS 75 kB gzip, CSS 6 kB gzip).
- [x] Monolithic `App.tsx` / `styles.css` split into app shell, page sections, components, hooks, content and styles.
- [x] `.gitignore` added (repository had none; `node_modules` would have been committed).

## Visual system
- [x] Design tokens: colour, typography, spacing, layout, radius, shadow, motion, z-index (`src/styles/tokens.css`).
- [x] Geist + Geist Mono, self-hosted variable fonts; **zero third-party requests** on load (verified in browser).
- [x] Pure white canvas, black/grey hierarchy, 15px workhorse size (16px on phones), no display headlines.
- [x] Removed: oversized headlines, purple and green accents, grain overlay, tinted section backgrounds.
- [x] Single accent: a status dot, used only when a repository states a status.

## Shell and navigation
- [x] Fixed, centred control cluster (Home · Sound · Menu) on all widths.
- [x] Sound toggle stores the preference (`aria-pressed`, localStorage); no audio until M2.
- [x] Menu: inset rounded sheet over a dimmed page; Buddy + line; numbered links (current in ink); social links.
- [x] Controls settle inside the sheet when it opens; menu icon folds into a close icon.
- [x] Menu accessibility: focus moves to the current link, Tab trapped, Escape closes, backdrop click closes, focus returns to the menu button, page scroll locked with scrollbar compensation, background `inert`.
- [x] Enter and exit animations, with the closing state kept mounted until the animation ends.
- [x] Section rail (≥1240px, right margin) and a scroll progress line, with no React re-render per scroll event.
- [x] Skip link, favicon.

## Story components
- [x] `BuddySeat` (hero / inline / menu) reserving Buddy's box with `data-buddy-seat` for M3.
- [x] `SectionLabel`, `TwoTone` (lead in ink + continuation in grey), `Action` (pill / text).
- [x] Home composition: hero identity + Buddy, About (lede + facts), Work (verified project index), Contact.
- [x] Project content taken only from repositories; contact email / LinkedIn configurable and hidden until set.

## Validation (Playwright + Chrome against `vite preview`)
- [x] Screenshots at 1440, 1024 and 390 px (hero, each section, full page, menu open).
- [x] No horizontal overflow at any width; no console errors.
- [x] Keyboard: focus trap, Escape, focus return verified programmatically at all three widths.
- [x] Menu navigation lands each section below the controls.
- [x] Reduced motion: Buddy idle animation off, menu opens/closes instantly, smooth scroll off.
- [ ] Owner review of composition, copy and proportions.
- [ ] Real-device check (iOS Safari, Android Chrome); deferred to an M1 preview deployment or M8.

## Out of scope (later milestones)
Terminal intro and liquid metal (M2) · 3D Buddy and seat-to-seat flight (M3) · carousel, word-timed reveals (M4) · case studies and routes (M5) · playground (M6) · contact form (M7).
