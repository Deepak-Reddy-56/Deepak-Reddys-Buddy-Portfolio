"""
Derive Buddy's Liquid Metal mask and face geometry from the approved reference.

The reference (design/buddy-reference.webp) is the visual authority, but it is
not usable as a mask directly: its silhouette is cropped flat against all four
image edges and it carries a few isolated semi-transparent pixels. Paper's
Liquid Metal treats *any* alpha > 0 as shape, so those defects show up as flat
cuts and chrome specks.

This script:
  1. keeps only the largest opaque component (alpha > 128) and fills holes;
  2. traces the outline from the centroid, discards samples lying on the
     cropped image border, and fits a smooth periodic curve (Fourier series)
     to the remaining samples, which restores the cropped arcs while keeping
     Buddy's asymmetry;
  3. rasterises that outline anti-aliased (4x supersampling) onto a padded,
     fully transparent canvas: white RGB, alpha = coverage, nothing else;
  4. measures the eyes, eye highlights and nose (moment-fitted ellipses) and
     the smile, and writes them in mask coordinates to
     src/features/buddy/buddyGeometry.ts.

Usage (Python 3 + numpy, scipy, Pillow; decode the WebP first if your Pillow
cannot read it):
    ffmpeg -i design/buddy-reference.webp /tmp/buddy-reference.png
    python scripts/generate-buddy-mask.py /tmp/buddy-reference.png
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'design' / 'buddy-reference.webp'
OUT_MASK = ROOT / 'public' / 'buddy' / 'buddy-mask.png'
OUT_TS = ROOT / 'src' / 'features' / 'buddy' / 'buddyGeometry.ts'

PAD = 0.14          # padding on every side, as a fraction of the body width
HARMONICS = 10      # outline smoothness (higher = closer to the raw trace)
SS = 4              # supersampling for the anti-aliased edge
OUT_WIDTH = 480     # mask width in px (Paper re-samples it for processing)

rgba = np.array(Image.open(SRC).convert('RGBA')).astype(float)
alpha, rgb = rgba[..., 3], rgba[..., :3]
lum = rgb @ np.array([0.299, 0.587, 0.114])
H, W = alpha.shape

# 1. Body: the largest opaque component, holes filled.
labels, count = nd.label(alpha > 128)
sizes = nd.sum(alpha > 128, labels, range(1, count + 1))
body = nd.binary_fill_holes(labels == (int(np.argmax(sizes)) + 1))
ys, xs = np.nonzero(body)
cx, cy = xs.mean(), ys.mean()

# 2. Outline trace from the centroid; drop samples on the cropped border.
angles = np.linspace(0, 2 * np.pi, 1440, endpoint=False)
radii, valid = [], []
for a in angles:
    dx, dy = np.cos(a), np.sin(a)
    r = 0.0
    while True:
        x, y = cx + (r + 0.25) * dx, cy + (r + 0.25) * dy
        if not (0 <= x < W and 0 <= y < H) or not body[int(y), int(x)]:
            break
        r += 0.25
    ex, ey = cx + r * dx, cy + r * dy
    on_border = ex < 1.5 or ey < 1.5 or ex > W - 2.5 or ey > H - 2.5
    radii.append(r)
    valid.append(not on_border)
radii, valid = np.array(radii), np.array(valid)

def basis(theta):
    cols = [np.ones_like(theta)]
    for k in range(1, HARMONICS + 1):
        cols += [np.cos(k * theta), np.sin(k * theta)]
    return np.stack(cols, axis=1)

A = basis(angles[valid])
ridge = 1e-3 * np.diag([0] + [k * k for k in range(1, HARMONICS + 1) for _ in (0, 1)])
coef = np.linalg.solve(A.T @ A + ridge * len(A), A.T @ radii[valid])
fit = basis(angles) @ coef
outline = np.stack([cx + fit * np.cos(angles), cy + fit * np.sin(angles)], axis=1)

# 3. Padded canvas; rasterise anti-aliased.
x0, y0 = outline.min(axis=0)
x1, y1 = outline.max(axis=0)
body_w, body_h = x1 - x0, y1 - y0
pad = PAD * body_w
canvas_w, canvas_h = body_w + 2 * pad, body_h + 2 * pad
scale = OUT_WIDTH / canvas_w
out_w, out_h = OUT_WIDTH, int(round(canvas_h * scale))

def to_mask(px, py):
    return (px - x0 + pad) * scale, (py - y0 + pad) * scale

big = Image.new('L', (out_w * SS, out_h * SS), 0)
pts = [tuple(np.array(to_mask(px, py)) * SS) for px, py in outline]
ImageDraw.Draw(big).polygon(pts, fill=255)
coverage = big.resize((out_w, out_h), Image.Resampling.BOX)
mask = Image.merge('RGBA', [Image.new('L', (out_w, out_h), 255)] * 3 + [coverage])
OUT_MASK.parent.mkdir(parents=True, exist_ok=True)
mask.save(OUT_MASK, optimize=True)

# 4. Face geometry (moment-fitted ellipses, mask coordinates).
def ellipse(m):
    yy, xx = np.nonzero(m)
    mx, my = xx.mean(), yy.mean()
    w, v = np.linalg.eigh(np.cov(np.vstack([xx - mx, yy - my])))
    major_angle = np.degrees(np.arctan2(v[1, 1], v[0, 1]))
    px, py = to_mask(mx, my)
    return {'cx': px, 'cy': py, 'rx': 2 * np.sqrt(w[0]) * scale, 'ry': 2 * np.sqrt(w[1]) * scale,
            'rotate': major_angle - 90}

dark = (lum < 60) & (alpha > 200) & body
dl, dn = nd.label(dark)
ds = nd.sum(dark, dl, range(1, dn + 1))
order = np.argsort(ds)[::-1][:3]
parts = sorted([nd.binary_fill_holes(dl == i + 1) for i in order[:2]], key=lambda m: np.nonzero(m)[1].mean())
eyes = []
for m in parts:
    e = ellipse(m)
    bright = (lum > 215) & m
    bl, bn = nd.label(bright)
    bs = nd.sum(bright, bl, range(1, bn + 1))
    hl = [ellipse(bl == j + 1) for j in np.argsort(bs)[::-1][:2]]
    eyes.append({**e, 'highlight': hl[0], 'glint': hl[1]})
nose_mask = nd.binary_fill_holes(dl == order[2] + 1)
nose = ellipse(nose_mask)
nose['rotate'] = nose['rotate'] + 90  # its major axis is horizontal
nose['rx'], nose['ry'] = nose['ry'], nose['rx']

# The smile is a faint curve in the reference (measured by hand from it):
# from (110, 243) dipping to (138, 253) and rising to (166, 248), reference px.
smile = [to_mask(110, 243), to_mask(138, 256), to_mask(166, 248)]

def r(v):
    return round(float(v), 2)

geometry = {
    'width': out_w, 'height': out_h,
    'body': {'x': r(pad * scale), 'y': r(pad * scale), 'width': r(body_w * scale), 'height': r(body_h * scale)},
    'eyes': [{k: (r(v) if not isinstance(v, dict) else {kk: r(vv) for kk, vv in v.items()}) for k, v in e.items()} for e in eyes],
    'nose': {k: r(v) for k, v in nose.items()},
    'smile': [[r(px), r(py)] for px, py in smile],
}
OUT_TS.write_text(
    '// Generated by scripts/generate-buddy-mask.py from design/buddy-reference.webp. Do not edit by hand.\n'
    '// Mask-space coordinates (px of public/buddy/buddy-mask.png).\n'
    'export const buddyGeometry = ' + json.dumps(geometry, indent=2) + ' as const;\n'
)
print(json.dumps({'mask': str(OUT_MASK.relative_to(ROOT)), 'size': [out_w, out_h], 'validSamples': int(valid.sum()),
                  'bodyFraction': r(body_w / canvas_w)}, indent=1))
