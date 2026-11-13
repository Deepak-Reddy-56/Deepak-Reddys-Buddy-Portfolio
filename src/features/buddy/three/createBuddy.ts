import { BuddyDirector } from '../BuddyDirector';
import { BuddyRenderer } from './BuddyRenderer';

/**
 * Lazy entry point (dynamic import): three.js and the model load in their own
 * chunk, after the page is interactive. Throws if WebGL is unavailable.
 */
export function createBuddy(
  canvas: HTMLCanvasElement,
  onContextLost: () => void,
  paperSkin: HTMLDivElement | null = null,
) {
  const renderer = new BuddyRenderer(canvas, onContextLost, paperSkin);
  const director = new BuddyDirector(renderer);
  return {
    director,
    dispose() {
      director.dispose();
      renderer.dispose();
    },
  };
}
