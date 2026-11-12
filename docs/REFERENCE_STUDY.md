# Reference study — Adam Perlis

Reference: https://www.awwwards.com/sites/adam-perlis  
Live site: https://adamperlis.com/  
Playground: https://adamperlis.com/playground/  
Making-of: https://adamperlis.com/how-i-built-this/

## What makes the experience memorable

### 1. An intentional front door
The first view is sparse and confident. A browser-like frame, small introduction, and one central character create a clear focal point. The site does not immediately dump a résumé onto the visitor.

### 2. Interaction before explanation
The mobile walkthrough shows a terminal/boot moment and a short character reveal. The visitor participates in starting the experience, which makes the site feel like a product rather than a document.

### 3. A recurring character with a role
Buddy appears across the experience, speaks short lines, changes expression, and occupies space reserved for him. The character advances the narrative and never obscures the main content.

### 4. Scroll as storytelling
Each section has its own composition and reveal. The page alternates between calm editorial layouts, rich media, and concise copy. Motion is choreographed, not added indiscriminately.

### 5. Work shown as products
Projects have status, context, a concise description, a meaningful visual, and deeper case-study content. The visitor can understand both what shipped and how it was made.

### 6. A genuine playground
The playground includes controls for the character and multiple motion experiments. It proves craft and invites exploration.

### 7. A documented process
The making-of page explains the early idea, references, experiments that failed, character evolution, and the technical stack. The development journey itself becomes part of the story.

## Technical signals from the making-of article

The reference describes a mostly static/prerendered site, with:
- Astro and Tailwind for the site and design tokens
- GSAP and Lenis for choreographed motion and smooth scrolling
- Three.js for the character
- Web Audio and prerecorded/word-timed audio for sound and voice
- DialKit-style controls for the playground

These are useful architectural cues, not a requirement to copy its exact stack. We will choose tools based on our implementation and performance needs.

## What we should borrow

- restraint, hierarchy, whitespace, pacing
- clear chapter-like storytelling
- strong object/character motif
- tactile, responsive interactions
- real project evidence and editorial case studies
- a playground that exposes the craft
- iteration and build notes

## What must be original

- Buddy's visual design, geometry, face, behavior, voice, and lines
- Deepak's story, project writing, visuals, and code
- palette, typography pairings, compositions, and details
- interaction choreography and the way the visitor moves through the story

## Original creative proposition (working)

**A small companion navigating a world of systems.**

Buddy acts like a curious guide through the things Deepak builds: software, tools, security systems, interfaces, and experiments. The character should feel tactile and expressive, but the overall art direction should remain clean and editorial.
