import type { ExpressionName } from './expressions';

/** Body language the director computes each frame (renderer-agnostic). */
export type BuddyPose = {
  /** Bank (z) in radians; pitch/yaw are kept for future 3D-aware renderers. */
  bank: number;
  pitch: number;
  yaw: number;
  /** Squash/stretch: > 1 = taller. */
  stretch: number;
  /** Vertical bob in body units. */
  bob: number;
  /** 0 = sitting on the page, 1 = flying. */
  flying: number;
};

/** What the director drives. The face controls must act on the face that is actually visible. */
export interface BuddyView {
  resize(width: number, height: number): void;
  /** Centre at viewport (x, y), body width `size` CSS px, optional opacity (reduced-motion seat changes). */
  place(x: number, y: number, size: number, opacity?: number): void;
  /** Advance face easing; returns true while something is still changing. */
  update(dt: number, pose: BuddyPose, talk: number): boolean;
  render(): void;
  readonly model: {
    setExpression(name: ExpressionName): void;
    setGaze(x: number, y: number): void;
    setBlink(amount: number): void;
  };
}

/** One lifecycle for the one Buddy. Nothing else is ever shown in his place. */
export type BuddyStatus = 'loading' | 'live' | 'unavailable';
