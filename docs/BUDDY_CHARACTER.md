# Buddy — character direction

## Chosen direction
A compact, expressive liquid-chrome companion with an organic pebble silhouette and a warm, slightly mischievous personality.

## Visual ingredients
- The approved Buddy silhouette is used as a transparent mask, not as a displayed bitmap.
- Paper Liquid Metal continuously animates the silver body and iridescent ribbons.
- Eyes, white highlights, matte black oval nose, and complete curved smile are independent SVG layers above the shader.
- The face stays crisp while the material moves.
- The small hero size remains close to the Adam Perlis reference scale.

## Originality boundary
The Adam Perlis site is a reference for material, scale, and storytelling. Buddy uses the silhouette and face artwork provided by Deepak, with original animation, movement, and dialogue.

## Personality
- Curious, observant, encouraging, slightly cheeky.
- Speaks in short, situational lines.
- Never behaves like a generic chatbot.
- Guides visitors between chapters and calls attention to meaningful details.

## Implementation
- Live body: `@paper-design/shaders-react` LiquidMetal, with `public/buddy-mask.svg` as its alpha mask.
- Face: independent SVG layers inside the same transformed stage element.
- Blink: CSS eye-group animation.
- Talking: the voice envelope from BuddyRenderer toggles the animated mouth shape.
- Positioning and movement: `src/features/buddy/BuddyDirector.ts` and `flight.ts`.
- Three.js: genuine fallback if Paper's shader cannot initialize.
- Reduced motion: animated-material motion is removed and the lightweight CSS representation is used.
