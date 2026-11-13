import {
  ACESFilmicToneMapping,
  DirectionalLight,
  OrthographicCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Texture,
} from 'three';
import { BuddyModel, type BuddyPose } from './buddyModel';
import { createStudioEnvironment } from './studioEnvironment';

/**
 * The single persistent WebGL context for Buddy. A full-viewport, transparent,
 * click-through canvas with an orthographic camera in CSS pixels, so placing
 * Buddy at a DOM-measured point is exact.
 */
export class BuddyRenderer {
  readonly model = new BuddyModel();
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(0, 1, 0, -1, -4000, 4000);
  private readonly env: Texture;
  private width = 0;
  private height = 0;
  /** Buddy's on-screen box (CSS px) this frame and last frame — the only area drawn. */
  private box = { x: 0, y: 0, w: 0, h: 0 };
  private lastBox = { x: 0, y: 0, w: 0, h: 0 };

  constructor(canvas: HTMLCanvasElement, onContextLost: () => void) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      onContextLost();
    });

    this.env = createStudioEnvironment(this.renderer);
    this.scene.environment = this.env;
    const key = new DirectionalLight(0xffffff, 0.6);
    key.position.set(-1, 1.2, 1.5);
    this.scene.add(key, this.model.root);
    this.camera.position.z = 1000;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    const small = Math.min(width, height) < 700 || window.matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = -height;
    this.camera.updateProjectionMatrix();
  }

  /** Place Buddy's centre at viewport (x, y) with a body width of `size` CSS px. */
  place(x: number, y: number, size: number): void {
    this.model.root.position.set(x, -y, 0);
    this.model.root.scale.setScalar(size / 2);
    // Generous bounds: tilt, stretch and the contact shadow stay inside.
    const half = size * 0.82;
    this.box = { x: x - half, y: y - half * 0.95, w: half * 2, h: half * 2.15 };
  }

  update(dt: number, pose: BuddyPose, talk: number): boolean {
    return this.model.update(dt, pose, talk);
  }

  /**
   * Draws only the region Buddy occupies (union with last frame's, so his old
   * position is cleared). Fill cost scales with Buddy's size, not the viewport.
   */
  render(): void {
    if (!this.width || !this.height) return;
    const a = this.box;
    const b = this.lastBox;
    const x0 = Math.max(0, Math.floor(Math.min(a.x, b.w ? b.x : a.x)));
    const y0 = Math.max(0, Math.floor(Math.min(a.y, b.w ? b.y : a.y)));
    const x1 = Math.min(this.width, Math.ceil(Math.max(a.x + a.w, b.x + b.w)));
    const y1 = Math.min(this.height, Math.ceil(Math.max(a.y + a.h, b.y + b.h)));
    this.lastBox = a;
    if (x1 <= x0 || y1 <= y0) {
      this.renderer.setScissorTest(false);
      this.renderer.clear();
      return;
    }
    // three's scissor uses CSS pixels with a bottom-left origin.
    this.renderer.setScissorTest(true);
    this.renderer.setScissor(x0, this.height - y1, x1 - x0, y1 - y0);
    this.renderer.setViewport(0, 0, this.width, this.height);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.model.dispose();
    this.env.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
