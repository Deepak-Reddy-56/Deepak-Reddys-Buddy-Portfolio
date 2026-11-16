import { getShaderColorFromString, ShaderFitOptions, ShaderMount, toProcessedLiquidMetal } from '@paper-design/shaders';
import { buildAccessory, svg, type AccessoryName, type AccessoryParts } from './buddyAccessories';
import { buddyFace as F } from './buddyFace';
import { buddyGeometry as G } from './buddyGeometry';
import { buddyLook, buddyMaterial as M, mixLook, terminalLook, type LiquidLook } from './buddyMaterial';
import { expressions, type ExpressionName, type ExpressionParams } from './expressions';
import { liquidBuddyFragmentShader } from './liquidBuddyShader';
import type { BuddyPose, BuddyStatus, BuddyView } from './types';

/** Layout size of the character element (CSS px) before scaling. Mask aspect. */
const BASE_W = 300;
const BASE_H = (BASE_W * G.height) / G.width;
/** The body's width inside the element at scale 1 (the mask is padded). */
const BODY_BASE_W = (BASE_W * G.body.width) / G.width;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Buddy's head is treated as a sphere (squashed to the body's ellipse): the face
 * is painted on it, so turning his head slides the eyes and mouth across the
 * body and foreshortens them near the edge — the face can turn right round.
 */
const HEAD = {
  cx: G.body.x + G.body.width / 2,
  cy: G.body.y + G.body.height / 2,
  rx: G.body.width / 2,
  ry: G.body.height / 2,
};
/** Gaze (-1..1) → head angles (radians). */
const YAW_RANGE = 1.0;
const PITCH_RANGE = 0.62;
/** Head spring: a touch under-damped, so a quick look settles with a tiny overshoot. */
const HEAD_K = 70;
const HEAD_DAMP = 0.68;

type Spring = { x: number; v: number };
function stepSpring(sp: Spring, target: number, dt: number): void {
  const c = 2 * Math.sqrt(HEAD_K) * HEAD_DAMP;
  let left = Math.min(dt, 0.1);
  while (left > 0) {
    const h = Math.min(left, 1 / 120);
    sp.v += (HEAD_K * (target - sp.x) - c * sp.v) * h;
    sp.x += sp.v * h;
    left -= h;
  }
}

/** A point painted on the head at rest, turned by (yaw, pitch): screen position, foreshortening, facing. */
function projectOnHead(px: number, py: number, yaw: number, pitch: number) {
  const nx = clamp((px - HEAD.cx) / HEAD.rx, -0.95, 0.95);
  const ny = clamp((py - HEAD.cy) / HEAD.ry, -0.95, 0.95);
  const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const x1 = nx * cy + nz * sy;
  const z1 = -nx * sy + nz * cy;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  // Positive pitch looks up: the face moves up the head.
  const y2 = ny * cp - z1 * sp;
  const z2 = ny * sp + z1 * cp;
  const fx = Math.sqrt(Math.max(0, 1 - x1 * x1)) / Math.sqrt(1 - nx * nx);
  const fy = Math.sqrt(Math.max(0, 1 - y2 * y2)) / Math.sqrt(1 - ny * ny);
  return { x: HEAD.cx + x1 * HEAD.rx, y: HEAD.cy + y2 * HEAD.ry, fx: clamp(fx, 0, 1.2), fy: clamp(fy, 0, 1.2), z: z2 };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Pop-in with a small overshoot (0 → ~1.08 → 1). */
const pop = (t: number) => {
  const x = clamp(t, 0, 1);
  const c = 2.2;
  return x === 0 ? 0 : 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

type EyeParts = { group: SVGGElement; shine: SVGGElement; cx: number; cy: number };
/** A screen-space box Buddy's canvas is stretched over while it is still the terminal. */
export type MorphBox = { x: number; y: number; w: number; h: number; radius: number };

/**
 * The one visible Buddy.
 *
 *   root (fixed, positioned by the director or the intro)
 *     breath (CSS idle breathing; off for reduced motion)
 *       body  — Paper Liquid Metal on the cleaned silhouette mask (one WebGL canvas)
 *       face  — SVG elliptical eyes (highlight + glint) and a small smile; no nose
 *
 * Body and face share one coordinate space (the mask's), so the face stays
 * aligned through every move, tilt and scale. The material animates on its
 * own Paper clock, so the surface keeps flowing while the director sleeps.
 */
export class PaperBuddyView implements BuddyView {
  status: BuddyStatus = 'loading';
  readonly ready: Promise<void>;

  private readonly root: HTMLElement;
  private readonly breath: HTMLDivElement;
  private readonly body: HTMLDivElement;
  private readonly face: SVGSVGElement;
  private readonly eyes: EyeParts[] = [];
  /** One mouth path: a smile line when closed, an open smiling mouth when talking. */
  private readonly smile: SVGPathElement;
  private mount: ShaderMount | null = null;
  private maskImage: HTMLImageElement | null = null;
  private maskUrl: string | null = null;
  private disposed = false;
  private restoreAttempts = 0;
  private resolveReady!: () => void;
  private rejectReady!: (error: unknown) => void;
  private readonly onStatus: (status: BuddyStatus) => void;
  private readonly reducedMotion: boolean;

  private placement = { x: 0, y: 0, size: 0, opacity: 1, placed: false };
  private pose: BuddyPose = { bank: 0, pitch: 0, yaw: 0, stretch: 1, bob: 0, flying: 0 };
  private expr: ExpressionParams = { ...expressions.idle };
  private exprTarget: ExpressionParams = { ...expressions.idle };
  private gaze = { x: 0, y: 0 };
  private gazeTarget = { x: 0, y: 0 };
  /** Head angles (radians), sprung towards the gaze; the eyes lead, the head follows. */
  private yaw: Spring = { x: 0, v: 0 };
  private pitch: Spring = { x: 0, v: 0 };
  /** Extra turn (radians) on top of the gaze, e.g. turning away as he flies off. */
  private spin = 0;
  private lastAngle: number = M.angle;
  private faceGroup!: SVGGElement;
  private blink = 0;
  private talk = 0;
  /** Smoothed mouth opening (fast to open, a little slower to close — like real speech). */
  private mouthOpen = 0;
  private faceReveal = 1;
  /** Eyes held shut (dozing), 0..1. */
  private sleep = 0;
  /** Outfit: the one being worn, and one waiting for the middle of a twirl. */
  private accessory: AccessoryName = 'none';
  private accessoryParts: AccessoryParts | null = null;
  private pendingAccessory: AccessoryName | null = null;
  /** A full turn (costume change): seconds elapsed, or -1 when not twirling. */
  private twirl = -1;
  /** Pop-in of a new outfit (0 → 1). */
  private accessoryIn = 1;
  private defs!: SVGDefsElement;
  private accessoryLayer!: SVGGElement;
  private readonly uid = Math.random().toString(36).slice(2, 8);
  private form = 1;
  private box: MorphBox | null = null;
  private look: LiquidLook = buddyLook;
  private concealed = false;
  private pixelBudget = 0;

  constructor(root: HTMLElement, options: { reducedMotion: boolean; onStatus: (status: BuddyStatus) => void }) {
    this.root = root;
    this.reducedMotion = options.reducedMotion;
    this.onStatus = options.onStatus;
    root.style.width = BASE_W + 'px';
    root.style.height = BASE_H + 'px';

    this.breath = document.createElement('div');
    this.breath.dataset.part = 'breath';
    this.body = document.createElement('div');
    this.body.dataset.part = 'body';
    this.face = document.createElementNS(SVG_NS, 'svg');
    this.face.dataset.part = 'face';
    this.face.setAttribute('viewBox', `0 0 ${G.width} ${G.height}`);
    this.face.setAttribute('aria-hidden', 'true');
    this.breath.append(this.body, this.face);
    root.append(this.breath);
    // The face is clipped to the head, so features slide out of sight round the side.
    const defs = el('defs');
    const clip = el('clipPath');
    const clipId = 'buddy-head-' + Math.random().toString(36).slice(2, 8);
    clip.setAttribute('id', clipId);
    clip.append(ellipse(HEAD.cx, HEAD.cy, HEAD.rx * 0.985, HEAD.ry * 0.985, 0, '#000'));
    defs.append(clip);
    this.defs = defs;
    this.faceGroup = el('g');
    this.faceGroup.setAttribute('clip-path', `url(#${clipId})`);
    this.face.append(defs, this.faceGroup);

    // Eyes: black ellipses with a white highlight and a tiny glint (from the approved design).
    for (const eye of F.eyes) {
      const group = el('g');
      group.append(ellipse(eye.cx, eye.cy, eye.rx, eye.ry, eye.rotate, '#050506'));
      const shine = el('g');
      const h = eye.highlight;
      const g = eye.glint;
      shine.append(ellipse(h.cx, h.cy, h.rx, h.ry, h.rotate, '#ffffff'), ellipse(g.cx, g.cy, g.rx, g.ry, g.rotate, '#ffffff'));
      group.append(shine);
      this.faceGroup.append(group);
      this.eyes.push({ group, shine, cx: eye.cx, cy: eye.cy });
    }
    this.smile = el('path') as SVGPathElement;
    this.smile.setAttribute('fill', '#0c0c0f');
    this.smile.setAttribute('stroke', '#0c0c0f');
    this.smile.setAttribute('stroke-linejoin', 'round');
    this.smile.setAttribute('stroke-width', String(F.smileWidth));
    this.smile.setAttribute('stroke-linecap', 'round');
    this.faceGroup.append(this.smile);
    // Outfits sit over the head and are not clipped (hats stick out above it).
    this.accessoryLayer = svg('g', { 'data-part': 'accessories' });
    this.face.append(this.accessoryLayer);

    this.ready = new Promise<void>((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    this.ready.catch(() => undefined);
    this.drawFace();
    this.applyTransform();
    void this.start();
  }

  // ── lifecycle ────────────────────────────────────────────────

  private setStatus(next: BuddyStatus): void {
    if (this.status === next || this.disposed) return;
    this.status = next;
    this.root.dataset.status = next;
    this.applyTransform();
    this.onStatus(next);
  }

  /** Process the mask, create the shader, wait for its first frames, then go live. */
  private async start(): Promise<void> {
    try {
      if (!this.maskImage) {
        const processed = await toProcessedLiquidMetal(M.mask);
        if (this.disposed) return;
        this.maskUrl = URL.createObjectURL(processed.pngBlob);
        this.maskImage = await loadImage(this.maskUrl);
        if (this.disposed) return;
      }
      this.createMount(this.maskImage);
      // Two frames: the canvas has been sized and drawn the masked body at least once.
      await nextFrame();
      await nextFrame();
      if (this.disposed) return;
      this.setStatus('live');
      this.resolveReady();
    } catch (error) {
      console.error('[buddy] Live Liquid Metal renderer unavailable:', error);
      this.disposeMount();
      // Paper creates its canvas before it can fail; leave nothing behind.
      this.body.replaceChildren();
      this.setStatus('unavailable');
      this.rejectReady(error);
    }
  }

  private createMount(mask: HTMLImageElement): void {
    const mount = new ShaderMount(
      this.body,
      liquidBuddyFragmentShader,
      {
        u_image: mask,
        u_colorBack: [0, 0, 0, 0],
        u_colorTint: getShaderColorFromString(M.colorTint),
        u_contour: this.look.contour,
        u_distortion: this.look.distortion,
        u_softness: this.look.softness,
        u_repetition: this.look.repetition,
        u_shiftRed: this.look.shiftRed,
        u_shiftBlue: this.look.shiftBlue,
        u_liquid: this.look.liquid,
        u_angle: M.angle,
        u_isImage: true,
        u_shape: 0,
        u_form: this.form,
        u_shade: this.look.shade,
        u_box: this.box ? [this.box.w, this.box.h] : [BASE_W, BASE_H],
        u_boxRadius: this.box?.radius ?? 0,
        u_fit: ShaderFitOptions.contain,
        u_scale: 1,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      },
      { premultipliedAlpha: true, alpha: true },
      this.reducedMotion ? 0 : M.speed,
      this.reducedMotion ? M.stillFrame : 0,
      2,
      this.pixelBudget || 360_000,
      ['u_image'],
    );
    // A shader that failed to compile leaves no program (Paper only logs it).
    if (!(mount as unknown as { program: WebGLProgram | null }).program) {
      mount.dispose();
      throw new Error('Liquid Metal shader failed to compile or link.');
    }
    this.mount = mount;
    const canvas = mount.canvasElement;
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private onContextLost = (event: Event) => {
    event.preventDefault();
    this.setStatus('unavailable');
  };

  /** The browser gave the GPU back: rebuild on a fresh canvas (a couple of attempts at most). */
  private onContextRestored = () => {
    if (this.disposed || this.restoreAttempts >= 2 || !this.maskImage) return;
    this.restoreAttempts++;
    this.disposeMount();
    this.setStatus('loading');
    void this.start();
  };

  private disposeMount(): void {
    if (!this.mount) return;
    const canvas = this.mount.canvasElement;
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.mount.dispose();
    this.mount = null;
  }

  dispose(): void {
    this.disposed = true;
    this.disposeMount();
    if (this.maskUrl) URL.revokeObjectURL(this.maskUrl);
    this.breath.remove();
    delete this.root.dataset.status;
  }

  // ── director interface ───────────────────────────────────────

  readonly model = {
    setExpression: (name: ExpressionName) => {
      this.exprTarget = expressions[name];
    },
    setGaze: (x: number, y: number) => {
      this.gazeTarget = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
    },
    setBlink: (amount: number) => {
      this.blink = clamp(amount, 0, 1);
    },
  };

  resize(): void {
    // DOM-sized: nothing to do (the Paper canvas follows its element).
  }

  place(x: number, y: number, size: number, opacity = 1): void {
    this.box = null;
    this.placement = { x, y, size, opacity, placed: size > 0 };
    this.applyTransform();
    this.fitPixelBudget(size);
  }

  update(dt: number, pose: BuddyPose, talk: number): boolean {
    this.pose = pose;
    this.talk = talk;
    const k = 1 - Math.exp(-dt / 0.12);
    let changing = false;
    for (const key of Object.keys(this.expr) as (keyof ExpressionParams)[]) {
      const d = this.exprTarget[key] - this.expr[key];
      if (Math.abs(d) > 0.002) changing = true;
      this.expr[key] += d * k;
    }
    const tau = talk > this.mouthOpen ? 0.035 : 0.075;
    this.mouthOpen += (talk - this.mouthOpen) * (1 - Math.exp(-dt / tau));
    if (this.mouthOpen > 0.01 || talk > 0) changing = true;
    const kg = 1 - Math.exp(-dt / 0.09);
    const gx = this.gazeTarget.x - this.gaze.x;
    const gy = this.gazeTarget.y - this.gaze.y;
    if (Math.abs(gx) + Math.abs(gy) > 0.004) changing = true;
    this.gaze.x += gx * kg;
    this.gaze.y += gy * kg;
    if (this.stepTwirl(dt)) changing = true;
    if (this.stepHead(dt)) changing = true;
    this.drawFace();
    this.applyTransform();
    return changing;
  }

  /** Advance the head springs; true while the head is still moving. */
  private stepHead(dt: number): boolean {
    const yawTarget = this.gazeTarget.x * YAW_RANGE + this.spin;
    const pitchTarget = this.gazeTarget.y * PITCH_RANGE;
    if (this.reducedMotion) {
      this.yaw = { x: yawTarget, v: 0 };
      this.pitch = { x: pitchTarget, v: 0 };
      return false;
    }
    stepSpring(this.yaw, yawTarget, dt);
    stepSpring(this.pitch, pitchTarget, dt);
    return (
      Math.abs(this.yaw.v) + Math.abs(this.pitch.v) > 0.002 ||
      Math.abs(yawTarget - this.yaw.x) + Math.abs(pitchTarget - this.pitch.x) > 0.002
    );
  }

  /** Turn his head by an extra amount (radians), e.g. away from the visitor as he flies off. */
  /**
   * Change outfit. With `twirl`, he spins right round and the new outfit is on
   * when his face comes back (the swap happens while his back is turned).
   */
  setAccessory(name: AccessoryName, twirl = true): void {
    if (twirl && !this.reducedMotion) {
      this.pendingAccessory = name;
      this.twirl = 0;
      return;
    }
    this.applyAccessory(name);
  }

  get currentAccessory(): AccessoryName {
    return this.pendingAccessory ?? this.accessory;
  }

  get twirling(): boolean {
    return this.twirl >= 0;
  }

  /** Hold his eyes shut (dozing). */
  setSleep(amount: number): void {
    this.sleep = clamp(amount, 0, 1);
    this.drawFace();
  }

  private applyAccessory(name: AccessoryName): void {
    this.accessory = name;
    this.accessoryParts?.root.remove();
    this.accessoryParts = null;
    this.defs.querySelectorAll('[data-outfit]').forEach((node) => node.remove());
    if (name !== 'none') {
      const before = this.defs.childElementCount;
      this.accessoryParts = buildAccessory(name, HEAD, this.defs, this.uid);
      Array.from(this.defs.children).slice(before).forEach((node) => node.setAttribute('data-outfit', ''));
      this.accessoryLayer.append(this.accessoryParts.root);
    }
    this.accessoryIn = this.reducedMotion ? 1 : 0;
    this.drawFace();
  }

  /** Twirl: one full turn in 0.9 s; the outfit swaps at the half-way point. */
  private stepTwirl(dt: number): boolean {
    let busy = this.accessoryIn < 1;
    if (busy) this.accessoryIn = Math.min(1, this.accessoryIn + dt / 0.45);
    if (this.twirl < 0) return busy;
    const T = 0.9;
    this.twirl += dt;
    const u = Math.min(1, this.twirl / T);
    const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    this.spin = Math.PI * 2 * e;
    if (u >= 0.5 && this.pendingAccessory !== null) {
      this.applyAccessory(this.pendingAccessory);
      this.pendingAccessory = null;
    }
    if (u >= 1) {
      // Back to facing forward: drop the full turn from both target and head.
      this.twirl = -1;
      this.spin = 0;
      this.yaw.x -= Math.PI * 2;
    }
    busy = true;
    return busy;
  }

  setSpin(radians: number): void {
    this.spin = radians;
  }

  render(): void {
    // The Paper canvas renders on its own clock; the face is DOM.
  }

  // ── intro interface ──────────────────────────────────────────

  /**
   * Terminal → Buddy. `form` 0 = the terminal's rounded rectangle, 1 = Buddy's silhouette.
   * With a `box`, the canvas is stretched over that screen rectangle (the terminal's,
   * shrinking towards Buddy's seat); without one, the director's place() applies.
   */
  setMorph(form: number, box: MorphBox | null): void {
    this.form = clamp(form, 0, 1);
    if (box) {
      this.box = box;
      this.placement = { ...this.placement, placed: true, opacity: 1 };
      this.applyTransform();
      this.fitPixelBudget(Math.max(box.w, box.h * (BASE_W / BASE_H)) * (G.body.width / G.width));
    }
    // The terminal's soft dark chrome becomes Buddy's bright striped silver as he forms.
    this.look = mixLook(terminalLook, buddyLook, smooth(0, 1, this.form));
    this.mount?.setUniforms({
      u_form: this.form,
      u_box: box ? [box.w, box.h] : [BASE_W, BASE_H],
      u_boxRadius: box?.radius ?? 0,
      u_repetition: this.look.repetition,
      u_softness: this.look.softness,
      u_distortion: this.look.distortion,
      u_contour: this.look.contour,
      u_shiftRed: this.look.shiftRed,
      u_shiftBlue: this.look.shiftBlue,
      u_shade: this.look.shade,
      u_liquid: this.look.liquid,
    });
  }

  /**
   * Hide Buddy without disturbing him (the intro uses this so the page Buddy can
   * never sit on top of the terminal, e.g. when the intro is replayed mid-page).
   */
  setConcealed(concealed: boolean): void {
    if (this.concealed === concealed) return;
    this.concealed = concealed;
    this.applyTransform();
  }

  /** Facial reveal 0→1: eyes, then the pupils, then the smile is drawn. */
  setFaceReveal(amount: number): void {
    this.faceReveal = clamp(amount, 0, 1);
    this.drawFace();
  }

  /** Gaze set directly (intro look-around), skipping the director's easing. */
  lookAt(x: number, y: number, immediate = false): void {
    this.model.setGaze(x, y);
    if (immediate) {
      this.gaze = { ...this.gazeTarget };
      this.yaw = { x: this.gazeTarget.x * YAW_RANGE + this.spin, v: 0 };
      this.pitch = { x: this.gazeTarget.y * PITCH_RANGE, v: 0 };
    }
    this.drawFace();
  }

  /** Look (eyes and head) towards a point on screen, e.g. Deepak's photo or name tag. */
  lookToward(px: number, py: number): void {
    const dx = px - this.placement.x;
    const dy = py - this.placement.y;
    const len = Math.hypot(dx, dy) || 1;
    // Turn right round towards it (not just a glance).
    this.model.setGaze((dx / len) * 1.05, (-dy / len) * 0.95);
  }

  /** Advance face easing (and the speaking mouth) while the intro owns Buddy. */
  tickFace(dt: number, talk = this.talk): void {
    this.update(dt, this.pose, talk);
  }

  // ── drawing ──────────────────────────────────────────────────

  private applyTransform(): void {
    const { x, y, size, opacity, placed } = this.placement;
    const visible = placed && this.status === 'live' && !this.concealed;
    this.root.style.opacity = visible ? String(opacity) : '0';
    if (!placed) return;
    if (this.box) {
      const b = this.box;
      this.root.style.transform = `translate3d(${(b.x - BASE_W / 2).toFixed(2)}px, ${(b.y - BASE_H / 2).toFixed(2)}px, 0) scale(${(b.w / BASE_W).toFixed(4)}, ${(b.h / BASE_H).toFixed(4)})`;
      return;
    }
    const s = size / BODY_BASE_W;
    // The head turn is drawn on the face (see drawFace); the body only leans a little into it.
    const yaw = this.yaw.x - this.spin;
    const rot = this.pose.bank + this.expr.tilt * 0.6 + clamp(yaw, -1, 1) * 0.06;
    const tx = x - BASE_W / 2 + clamp(yaw, -1, 1) * size * 0.025;
    const ty = y - BASE_H / 2 - this.pose.bob * size * 0.5 - this.pitch.x * size * 0.03;
    this.root.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(4)}rad) scale(${s.toFixed(4)}, ${(s * this.pose.stretch).toFixed(4)})`;
    // Reflections swing with the head, so the chrome reads as a turning ball.
    const angle = M.angle + ((this.yaw.x * 180) / Math.PI) * 0.35;
    if (this.mount && Math.abs(angle - this.lastAngle) > 0.15) {
      this.lastAngle = angle;
      this.mount.setUniforms({ u_angle: angle });
    }
  }

  /** Keep the shader's pixel count proportional to Buddy's on-screen size. */
  private fitPixelBudget(size: number): void {
    if (!size) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const scale = size / BODY_BASE_W;
    const target = clamp(Math.round(BASE_W * scale * BASE_H * scale * dpr * dpr * 1.4), 40_000, 420_000);
    if (this.pixelBudget && Math.abs(target - this.pixelBudget) / this.pixelBudget < 0.2) return;
    this.pixelBudget = target;
    this.mount?.setMaxPixelCount(target);
  }

  private drawFace(): void {
    const e = this.expr;
    const r = this.faceReveal;
    const eyesIn = pop(smooth(0, 0.45, r));
    const shineIn = pop(smooth(0.3, 0.65, r));
    const smileIn = smooth(0.5, 1, r);
    // He wakes up: the eyes appear closed and open as the reveal completes.
    const asleep = 1 - smooth(0.55, 0.9, r);
    const blink = 1 - 0.93 * Math.max(this.blink, asleep, this.sleep);
    const lift = -e.eyeLift * G.height;
    const yaw = this.yaw.x;
    const pitch = this.pitch.x;
    // The eyes lead the head a little (they get there first; the head catches up).
    const leadX = clamp(this.gaze.x * YAW_RANGE + this.spin - yaw, -0.5, 0.5) * 18;
    const leadY = -clamp(this.gaze.y * PITCH_RANGE - pitch, -0.4, 0.4) * 14;
    const fade = (z: number) => smooth(-0.05, 0.3, z);

    this.eyes.forEach((eye, i) => {
      const p = projectOnHead(eye.cx, eye.cy, yaw, pitch);
      const scale = (i === 0 ? e.eyeLeft : e.eyeRight) * eyesIn;
      const sx = scale * e.eyeWidth * p.fx;
      const sy = scale * e.eyeHeight * blink * p.fy;
      eye.group.setAttribute(
        'transform',
        `translate(${(p.x + leadX).toFixed(2)} ${(p.y + leadY + lift).toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-eye.cx} ${-eye.cy})`,
      );
      eye.group.style.opacity = fade(p.z).toFixed(3);
      // Reflections stay put in the room while the eye turns under them.
      eye.shine.setAttribute(
        'transform',
        `translate(${(eye.cx - leadX * 0.5 - yaw * 10).toFixed(2)} ${(eye.cy - leadY * 0.5 + pitch * 8).toFixed(2)}) scale(${shineIn.toFixed(4)}) translate(${-eye.cx} ${-eye.cy})`,
      );
    });

    // Mouth: closed, a smile through the measured points; talking, it rounds into
    // a small open "o" whose height follows the voice. Both shapes use the same
    // path structure (two cubic halves), so one morphs smoothly into the other.
    const [p0, p1, p2] = F.smile;
    const open = clamp(this.mouthOpen * 1.3, 0, 1) * smileIn;
    const L = projectOnHead(p0[0], p0[1], yaw, pitch);
    const C = projectOnHead(p1[0], p1[1], yaw, pitch);
    const R = projectOnHead(p2[0], p2[1], yaw, pitch);
    const ox = leadX * 0.6;
    const oy = leadY * 0.5;
    const mx = (L.x + R.x) / 2 + ox;
    const my = (L.y + R.y) / 2 + oy;
    const half = ((R.x - L.x) / 2) * e.mouthWidth;
    const tilt = (R.y - L.y) / 2;
    // Smile (closed): quadratic through the dip, as cubic controls.
    const dip = (C.y + oy - my) * 2 * e.mouthCurve;
    const sL: Pt = [mx - half, my - tilt];
    const sR: Pt = [mx + half, my + tilt];
    const q: Pt = [mx + (C.x + ox - mx), my + dip];
    const sc1: Pt = [sL[0] + (2 / 3) * (q[0] - sL[0]), sL[1] + (2 / 3) * (q[1] - sL[1])];
    const sc2: Pt = [sR[0] + (2 / 3) * (q[0] - sR[0]), sR[1] + (2 / 3) * (q[1] - sR[1])];
    // Open "o": an ellipse a little narrower than the smile, dropping as it opens.
    const rx = half * 0.5 * (0.7 + 0.3 * open) * C.fx;
    const ry = (10 + 30 * open) * C.fy;
    const cy = my + dip * 0.35 + ry * 0.35;
    const k = 1.33;
    const oL: Pt = [mx - rx, cy];
    const oR: Pt = [mx + rx, cy];
    const t = smooth(0, 0.35, open);
    const mix = (a: Pt, b: Pt): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const A = mix(sL, oL);
    const B = mix(sR, oR);
    const u1 = mix(sc1, [mx - rx, cy - ry * k * 0.5]);
    const u2 = mix(sc2, [mx + rx, cy - ry * k * 0.5]);
    const d1 = mix(sc2, [mx + rx, cy + ry * k]);
    const d2 = mix(sc1, [mx - rx, cy + ry * k]);
    const f = (pt: Pt) => `${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`;
    this.smile.setAttribute('d', `M${f(A)} C${f(u1)} ${f(u2)} ${f(B)} C${f(d1)} ${f(d2)} ${f(A)} Z`);
    this.smile.style.opacity = fade(C.z).toFixed(3);
    this.drawAccessory(yaw, pitch, leadX, leadY, lift, fade);
    // Drawn in during the facial reveal; afterwards fully visible.
    if (smileIn < 1) {
      const length = this.smile.getTotalLength();
      this.smile.style.strokeDasharray = `${length / 2} ${length}`;
      this.smile.style.strokeDashoffset = `${(length / 2) * (1 - smileIn)}`;
      this.smile.style.fillOpacity = '0';
    } else {
      this.smile.style.strokeDasharray = '';
      this.smile.style.strokeDashoffset = '';
      this.smile.style.fillOpacity = '1';
    }
  }

  /** Place the outfit's pieces on the turned head. */
  private drawAccessory(yaw: number, pitch: number, leadX: number, leadY: number, lift: number, fade: (z: number) => number): void {
    const parts = this.accessoryParts;
    const shades = this.accessory === 'shades';
    // Sunglasses replace the eyes.
    this.eyes.forEach((eye) => {
      eye.group.style.visibility = shades ? 'hidden' : '';
    });
    if (!parts) return;
    const k = this.accessoryIn;
    const popIn = pop(k);
    // Pieces on top of the head: the crown barely moves as he turns; they lean a little with him.
    const topShift = Math.sin(yaw) * HEAD.rx * 0.16;
    const topLift = -Math.sin(pitch) * HEAD.ry * 0.1;
    const tilt = (Math.sin(yaw) * 9 - 6 * (this.accessory === 'tie' ? 1 : 0)).toFixed(2);
    parts.top.setAttribute(
      'transform',
      `translate(${(topShift).toFixed(2)} ${(topLift - (1 - popIn) * 40).toFixed(2)}) rotate(${tilt} ${HEAD.cx} ${HEAD.cy - HEAD.ry}) translate(${HEAD.cx} ${HEAD.cy - HEAD.ry}) scale(${popIn.toFixed(3)}) translate(${-HEAD.cx} ${-(HEAD.cy - HEAD.ry)})`,
    );
    parts.top.style.opacity = String(Math.min(1, k * 3));
    // Bow tie: under the chin, turning with the front of the body.
    const chin = projectOnHead(HEAD.cx, HEAD.cy + HEAD.ry * 0.86, yaw, pitch * 0.4);
    const chinX = chin.x - HEAD.cx;
    parts.chin.setAttribute('transform', `translate(${chinX.toFixed(2)} 0) translate(${HEAD.cx} ${HEAD.cy + HEAD.ry}) scale(${(chin.fx * popIn).toFixed(3)} ${popIn.toFixed(3)}) translate(${-HEAD.cx} ${-(HEAD.cy + HEAD.ry)})`);
    parts.chin.style.opacity = fade(chin.z).toFixed(3);
    if (shades) {
      // Cups on the sides of the head (the far one disappears behind him), joined by the band.
      const side = (dir: -1 | 1) => {
        const a = dir * Math.PI * 0.5 + yaw;
        return { x: HEAD.cx + Math.sin(a) * HEAD.rx * 1.02, z: Math.cos(a), w: Math.max(0.35, Math.abs(Math.sin(a))) };
      };
      const L = side(-1);
      const R = side(1);
      const cupY = HEAD.cy - HEAD.ry * 0.12 + topLift * 0.5;
      [L, R].forEach((c, i) => {
        parts.cups[i].setAttribute('transform', `translate(${c.x.toFixed(2)} ${cupY.toFixed(2)}) scale(${(popIn * (0.55 + 0.45 * c.w)).toFixed(3)} ${popIn.toFixed(3)})`);
        parts.cups[i].style.opacity = c.z < -0.25 ? '0' : '1';
      });
      // The band hugs the top of the head, just clear of it.
      const topY = HEAD.cy - HEAD.ry * 1.06 + topLift;
      const ctrlX = HEAD.cx + topShift * 1.2;
      const span = (R.x - L.x) / 2;
      parts.band.setAttribute('d', `M${L.x.toFixed(2)} ${(cupY - 34).toFixed(2)} C${(L.x - 4).toFixed(2)} ${(topY + 40).toFixed(2)} ${(ctrlX - span * 0.62).toFixed(2)} ${topY.toFixed(2)} ${ctrlX.toFixed(2)} ${topY.toFixed(2)} S${(R.x + 4).toFixed(2)} ${(topY + 40).toFixed(2)} ${R.x.toFixed(2)} ${(cupY - 34).toFixed(2)}`);
      parts.band.style.opacity = String(Math.min(1, k * 3));
      // Lenses over the eyes, foreshortened with them.
      const centres = this.eyes.map((eye) => projectOnHead(eye.cx, eye.cy + 6, yaw, pitch));
      centres.forEach((p, i) => {
        const s = popIn * 1.05;
        parts.lenses[i].setAttribute('transform', `translate(${(p.x + leadX * 0.4).toFixed(2)} ${(p.y + leadY * 0.4 + lift).toFixed(2)}) scale(${(p.fx * s).toFixed(3)} ${(p.fy * s).toFixed(3)})`);
        parts.lenses[i].style.opacity = fade(p.z).toFixed(3);
      });
      const [a, b] = centres;
      const mid = { x: (a.x + b.x) / 2 + leadX * 0.4, y: (a.y + b.y) / 2 + lift + leadY * 0.4 - 22 };
      parts.bridge.setAttribute('d', `M${(a.x + 40 * a.fx + leadX * 0.4).toFixed(2)} ${(mid.y + 4).toFixed(2)} Q${mid.x.toFixed(2)} ${(mid.y - 6).toFixed(2)} ${(b.x - 40 * b.fx + leadX * 0.4).toFixed(2)} ${(mid.y + 4).toFixed(2)}`);
      parts.bridge.style.opacity = (Math.min(fade(a.z), fade(b.z)) * Math.min(1, k * 3)).toFixed(3);
    }
  }
}

type Pt = [number, number];

function el(name: string): SVGGElement {
  return document.createElementNS(SVG_NS, name) as SVGGElement;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, rotate: number, fill: string): SVGEllipseElement {
  const node = document.createElementNS(SVG_NS, 'ellipse');
  node.setAttribute('cx', String(cx));
  node.setAttribute('cy', String(cy));
  node.setAttribute('rx', String(rx));
  node.setAttribute('ry', String(ry));
  if (rotate) node.setAttribute('transform', `rotate(${rotate} ${cx} ${cy})`);
  node.setAttribute('fill', fill);
  return node;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Buddy mask failed to load: ' + src));
    image.src = src;
  });
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
