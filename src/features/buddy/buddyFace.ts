/**
 * Buddy's face, measured from the owner's approved design (eyes, highlights,
 * glints and smile as fractions of the body, mapped into mask coordinates).
 * Elliptical eyes with a white highlight and a tiny glint; a small smile; no nose.
 */
import { buddyGeometry as G } from './buddyGeometry';

const bx = (f: number) => G.body.x + f * G.body.width;
const by = (f: number) => G.body.y + f * G.body.height;
const sx = (f: number) => f * G.body.width;
const sy = (f: number) => f * G.body.height;

export type FaceEllipse = { cx: number; cy: number; rx: number; ry: number; rotate: number };
export type FaceEye = FaceEllipse & { highlight: FaceEllipse; glint: FaceEllipse };

export const buddyFace: { eyes: FaceEye[]; smile: [number, number][]; smileWidth: number } = {
  eyes: [
    {
      cx: bx(0.351), cy: by(0.546), rx: sx(0.0795), ry: sy(0.1338), rotate: -9,
      highlight: { cx: bx(0.359), cy: by(0.499), rx: sx(0.0252), ry: sy(0.0392), rotate: -15 },
      glint: { cx: bx(0.3215), cy: by(0.6032), rx: sx(0.0085), ry: sy(0.013), rotate: -18 },
    },
    {
      cx: bx(0.688), cy: by(0.523), rx: sx(0.0724), ry: sy(0.1391), rotate: -5.5,
      highlight: { cx: bx(0.701), cy: by(0.476), rx: sx(0.024), ry: sy(0.0385), rotate: -10 },
      glint: { cx: bx(0.6825), cy: by(0.5703), rx: sx(0.0075), ry: sy(0.0128), rotate: 15 },
    },
  ],
  // A small, complete smile directly under the eyes (start, dip, end).
  smile: [
    [bx(0.434), by(0.7)],
    [bx(0.531), by(0.738)],
    [bx(0.628), by(0.695)],
  ],
  smileWidth: 7,
};
