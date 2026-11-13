import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { expressions, type ExpressionName, type ExpressionParams } from '../expressions';

/**
 * Buddy, modelled procedurally. Unit space: body is 2 wide (x ∈ [-1, 1]),
 * 1.68 tall (the placeholder's 0.84 ratio), 1.6 deep. The face uses the
 * placeholder's exact proportions, so a front-facing Buddy projects onto the
 * same layout the intro hands over to.
 */
const RY = 0.84;
const RZ = 0.8;

/** Point on the front of the (undeformed) body for a face position (x, y). */
function surfacePoint(x: number, y: number): Vector3 {
  const z = RZ * Math.sqrt(Math.max(0, 1 - x * x - (y / RY) ** 2));
  return new Vector3(x, y, z);
}

function surfaceNormal(p: Vector3): Vector3 {
  return new Vector3(p.x, p.y / (RY * RY), p.z / (RZ * RZ)).normalize();
}

function bodyGeometry(): SphereGeometry {
  const geometry = new SphereGeometry(1, 96, 64);
  const pos = geometry.attributes.position;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    // Pebble: ellipsoid, slightly fuller upper-left, a touch flatter underneath.
    let x = v.x;
    let y = v.y * RY;
    let z = v.z * RZ;
    const bulge = 0.035 * Math.exp(-((v.x + 0.45) ** 2 + (v.y - 0.45) ** 2) / 0.35);
    x += v.x * bulge;
    y += v.y * bulge;
    z += v.z * bulge;
    if (y < 0) y *= 0.96;
    pos.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function shadowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export type BuddyPose = {
  /** Bank (z), pitch (x), yaw (y) in radians. */
  bank: number;
  pitch: number;
  yaw: number;
  /** Squash/stretch: >1 = taller. */
  stretch: number;
  /** Vertical bob in body units. */
  bob: number;
  /** 0 = sitting on the page (shadow visible), 1 = flying. */
  flying: number;
};

export class BuddyModel {
  readonly root = new Group();
  private readonly tilt = new Group();
  private readonly body: Mesh;
  private readonly face = new Group();
  private readonly eyes: { group: Group; base: Vector3 }[] = [];
  private readonly mouth: Mesh;
  private readonly mouthOpen: Mesh;
  private readonly shadow: Mesh;
  private readonly disposables: { dispose(): void }[] = [];

  private current: ExpressionParams = { ...expressions.idle };
  private target: ExpressionParams = { ...expressions.idle };
  private blink = 0;
  private gaze = { x: 0, y: 0 };

  constructor() {
    const bodyGeo = bodyGeometry();
    const chrome = new MeshPhysicalMaterial({
      color: new Color('#f3f4f7'), // pearl silver
      metalness: 1,
      roughness: 0.045,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      iridescence: 0.5,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [220, 520],
      envMapIntensity: 1,
    });
    this.body = new Mesh(bodyGeo, chrome);

    // Eyes: glossy black ellipsoids following the body's curvature, with a painted highlight.
    const eyeGeo = new SphereGeometry(1, 32, 24);
    const eyeMat = new MeshPhysicalMaterial({ color: '#030304', roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.25 });
    const glintGeo = new SphereGeometry(1, 16, 12);
    const glintMat = new MeshBasicMaterial({ color: '#ffffff' });
    for (const side of [-1, 1]) {
      const base = surfacePoint(0.028 + side * 0.237, 0.141);
      const group = new Group();
      group.position.copy(base);
      group.lookAt(base.clone().add(surfaceNormal(base)));
      const eye = new Mesh(eyeGeo, eyeMat);
      eye.scale.set(0.112, 0.162, 0.045);
      const glint = new Mesh(glintGeo, glintMat);
      glint.scale.set(0.04, 0.046, 0.01);
      glint.position.set(0.032, 0.072, 0.04);
      group.add(eye, glint);
      this.face.add(group);
      this.eyes.push({ group, base: base.clone() });
    }

    // Mouth: the lower half of a thin torus (a "U"), plus an inner dark ellipse that opens when talking.
    const mouthPoint = surfacePoint(0.028, -0.0848);
    const mouthMat = new MeshBasicMaterial({ color: '#0d0d0f' });
    this.mouth = new Mesh(new TorusGeometry(0.068, 0.0095, 10, 40, Math.PI), mouthMat);
    this.mouth.rotation.z = Math.PI;
    this.mouthOpen = new Mesh(new SphereGeometry(1, 24, 16), mouthMat);
    this.mouthOpen.scale.set(0.06, 0.001, 0.01);
    const mouthGroup = new Group();
    mouthGroup.position.copy(mouthPoint).add(new Vector3(0, 0, 0.01));
    mouthGroup.lookAt(mouthPoint.clone().add(surfaceNormal(mouthPoint)));
    mouthGroup.add(this.mouth, this.mouthOpen);
    this.face.add(mouthGroup);

    // Contact shadow (stays level; fades while flying).
    const shadowTex = shadowTexture();
    this.shadow = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.2, depthWrite: false }));
    this.shadow.scale.set(1.7, 0.36, 1);
    this.shadow.position.set(0.02, -RY - 0.06, -0.5);

    this.tilt.add(this.body, this.face);
    this.root.add(this.shadow, this.tilt);

    this.disposables.push(bodyGeo, chrome, eyeGeo, eyeMat, glintGeo, glintMat, mouthMat, this.mouth.geometry, this.mouthOpen.geometry, shadowTex, this.shadow.geometry, this.shadow.material as MeshBasicMaterial);
  }

  setExpression(name: ExpressionName): void {
    this.target = { ...expressions[name] };
  }

  /** Where the eyes look, in body units relative to the face (−1…1). */
  setGaze(x: number, y: number): void {
    this.gaze.x = Math.max(-1, Math.min(1, x));
    this.gaze.y = Math.max(-1, Math.min(1, y));
  }

  /** 0 = open, 1 = closed. */
  setBlink(amount: number): void {
    this.blink = amount;
  }

  /** Advance expression easing and apply pose. Returns true while still easing. */
  update(dtSeconds: number, pose: BuddyPose, talk: number): boolean {
    const k = 1 - Math.exp(-dtSeconds / 0.12);
    let moving = false;
    for (const key of Object.keys(this.current) as (keyof ExpressionParams)[]) {
      const delta = this.target[key] - this.current[key];
      if (Math.abs(delta) > 0.001) moving = true;
      this.current[key] += delta * k;
    }
    const e = this.current;

    this.tilt.rotation.set(pose.pitch, pose.yaw + this.gaze.x * 0.12, pose.bank + e.tilt);
    this.tilt.scale.set(1 / Math.sqrt(pose.stretch), pose.stretch, 1);
    this.tilt.position.y = pose.bob;
    (this.shadow.material as MeshBasicMaterial).opacity = 0.2 * (1 - pose.flying);
    this.shadow.scale.set(1.7 * (1 - 0.15 * pose.bob * 10), 0.36, 1);

    const open = Math.max(0.06, 1 - this.blink);
    this.eyes.forEach(({ group, base }, i) => {
      const side = i === 0 ? e.eyeLeft : e.eyeRight;
      group.position.set(base.x + this.gaze.x * 0.035, base.y + this.gaze.y * 0.03 + e.eyeLift, base.z);
      group.scale.set(side * e.eyeWidth, side * open * e.eyeHeight, 1);
    });
    this.mouth.scale.set(e.mouthWidth, e.mouthCurve, 1);
    this.mouthOpen.scale.set(0.055 * e.mouthWidth, 0.001 + 0.04 * talk, 0.01);
    this.mouthOpen.position.y = -0.02 - 0.02 * talk;
    return moving;
  }

  dispose(): void {
    this.disposables.forEach((item) => item.dispose());
  }
}
