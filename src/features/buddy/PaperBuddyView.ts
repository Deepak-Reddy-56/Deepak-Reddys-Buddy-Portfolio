import { getShaderColorFromString, ShaderFitOptions, ShaderMount, toProcessedLiquidMetal } from '@paper-design/shaders';
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
  private blink = 0;
  private talk = 0;
  /** Smoothed mouth opening (fast to open, a little slower to close — like real speech). */
  private mouthOpen = 0;
  private faceReveal = 1;
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

    // Eyes: black ellipses with a white highlight and a tiny glint (from the approved design).
    for (const eye of F.eyes) {
      const group = el('g');
      group.append(ellipse(eye.cx, eye.cy, eye.rx, eye.ry, eye.rotate, '#050506'));
      const shine = el('g');
      const h = eye.highlight;
      const g = eye.glint;
      shine.append(ellipse(h.cx, h.cy, h.rx, h.ry, h.rotate, '#ffffff'), ellipse(g.cx, g.cy, g.rx, g.ry, g.rotate, '#ffffff'));
      group.append(shine);
      this.face.append(group);
      this.eyes.push({ group, shine, cx: eye.cx, cy: eye.cy });
    }
    this.smile = el('path') as SVGPathElement;
    this.smile.setAttribute('fill', '#0c0c0f');
    this.smile.setAttribute('stroke', '#0c0c0f');
    this.smile.setAttribute('stroke-linejoin', 'round');
    this.smile.setAttribute('stroke-width', String(F.smileWidth));
    this.smile.setAttribute('stroke-linecap', 'round');
    this.face.append(this.smile);

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
    this.drawFace();
    this.applyTransform();
    return changing;
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
    if (immediate) this.gaze = { ...this.gazeTarget };
    this.drawFace();
  }

  /** Look (eyes and head) towards a point on screen, e.g. Deepak's photo or name tag. */
  lookToward(px: number, py: number): void {
    const dx = px - this.placement.x;
    const dy = py - this.placement.y;
    const len = Math.hypot(dx, dy) || 1;
    this.model.setGaze(dx / len, -dy / len);
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
    // His head follows his eyes: a slight turn (tilt + narrowing) and a lean towards where he looks.
    const g = this.gaze;
    const rot = this.pose.bank + this.expr.tilt * 0.6 + g.x * 0.12 - g.y * g.x * 0.04;
    const tx = x - BASE_W / 2 + g.x * size * 0.05;
    const ty = y - BASE_H / 2 - this.pose.bob * size * 0.5 - g.y * size * 0.035;
    const turn = 1 - Math.abs(g.x) * 0.035;
    this.root.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(4)}rad) scale(${(s * turn).toFixed(4)}, ${(s * this.pose.stretch).toFixed(4)})`;
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
    const gx = this.gaze.x * 14;
    const gy = -this.gaze.y * 10;
    const lift = -e.eyeLift * G.height;
    const blink = 1 - 0.93 * this.blink;

    this.eyes.forEach((eye, i) => {
      const scale = (i === 0 ? e.eyeLeft : e.eyeRight) * eyesIn;
      const sx = scale * e.eyeWidth;
      const sy = scale * e.eyeHeight * blink;
      eye.group.setAttribute(
        'transform',
        `translate(${(eye.cx + gx).toFixed(2)} ${(eye.cy + gy + lift).toFixed(2)}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-eye.cx} ${-eye.cy})`,
      );
      // Reflections lag the eye a little (they belong to the room, not the eye).
      eye.shine.setAttribute(
        'transform',
        `translate(${(eye.cx - gx * 0.4).toFixed(2)} ${(eye.cy - gy * 0.4).toFixed(2)}) scale(${shineIn.toFixed(4)}) translate(${-eye.cx} ${-eye.cy})`,
      );
    });

    // Mouth: a quadratic smile through the measured points (width/curve follow the
    // expression). Talking opens it into a small smiling mouth: the lower lip drops
    // with the voice's loudness and the corners draw in slightly.
    const [p0, p1, p2] = F.smile;
    const open = clamp(this.mouthOpen * 1.25, 0, 1) * smileIn;
    const mx = (p0[0] + p2[0]) / 2 + gx * 0.45;
    const chordY = (p0[1] + p2[1]) / 2 + gy * 0.35;
    const half = ((p2[0] - p0[0]) / 2) * e.mouthWidth * (1 - 0.14 * open);
    const tiltY = (p2[1] - p0[1]) / 2;
    const ctrlY = chordY + (2 * (p1[1] - (p0[1] + p2[1]) / 2)) * e.mouthCurve * (1 - 0.35 * open);
    const ctrlX = mx + (p1[0] - (p0[0] + p2[0]) / 2);
    const lowerY = ctrlY + open * 30;
    const left = `${(mx - half).toFixed(2)} ${(chordY - tiltY).toFixed(2)}`;
    const right = `${(mx + half).toFixed(2)} ${(chordY + tiltY).toFixed(2)}`;
    this.smile.setAttribute(
      'd',
      `M${left} Q${ctrlX.toFixed(2)} ${ctrlY.toFixed(2)} ${right} Q${ctrlX.toFixed(2)} ${lowerY.toFixed(2)} ${left} Z`,
    );
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
}

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
