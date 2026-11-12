/**
 * GLSL mirror of the CSS Buddy placeholder (BuddyPlaceholder.module.css).
 * The intro settles into exactly this image so the hand-off to the DOM is
 * invisible. Keep the numbers in sync with the CSS (M3 replaces both).
 *
 * Space: `b` = position in the placeholder's box, CSS px, origin top-left;
 * W, H = box size (H = 0.84 W); em = W / 10 (the placeholder's font-size).
 */
export const glslBuddyCard = /* glsl */ `
vec3 hex(float r, float g, float b) { return vec3(r, g, b) / 255.0; }

// border-radius: 52% 48% 47% 53% / 56% 54% 46% 44%
// Each corner is an ellipse quadrant; the radii meet exactly on the edges, so
// the four corner distances are blended smoothly (no kink → no shading seam).
float cornerDist(vec2 b, vec2 c, vec2 r) { return (length((b - c) / r) - 1.0) * min(r.x, r.y); }

float sdBuddyShape(vec2 b, vec2 size) {
  float W = size.x, H = size.y;
  float sx = mix(0.52 * W, 0.53 * W, clamp(b.y / H, 0.0, 1.0));   // where horizontal radii meet
  float sy = mix(0.56 * H, 0.54 * H, clamp(b.x / W, 0.0, 1.0));   // where vertical radii meet
  vec2 rTL = vec2(0.52 * W, 0.56 * H), rTR = vec2(0.48 * W, 0.54 * H);
  vec2 rBR = vec2(0.47 * W, 0.46 * H), rBL = vec2(0.53 * W, 0.44 * H);
  float dTL = cornerDist(b, rTL, rTL);
  float dTR = cornerDist(b, vec2(W - rTR.x, rTR.y), rTR);
  float dBR = cornerDist(b, vec2(W - rBR.x, H - rBR.y), rBR);
  float dBL = cornerDist(b, vec2(rBL.x, H - rBL.y), rBL);
  float kx = 0.08 * W, ky = 0.08 * H;
  float wx = smoothstep(sx - kx, sx + kx, b.x);
  float wy = smoothstep(sy - ky, sy + ky, b.y);
  return mix(mix(dTL, dTR, wx), mix(dBL, dBR, wx), wy);
}

// Linear gradient, CSS angle convention (0deg = to top, clockwise).
float cssLinearT(vec2 b, vec2 size, float angleDeg) {
  float a = radians(angleDeg);
  vec2 dir = vec2(sin(a), -cos(a));
  float len = abs(size.x * sin(a)) + abs(size.y * cos(a));
  return dot(b - size * 0.5, dir) / len + 0.5;
}

vec3 bodyBase(float t) {
  // linear-gradient(158deg, #fafafb 0%, #dcdde2 38%, #b6b8c0 64%, #e9e9ee 86%, #c9cad1 100%)
  vec3 c0 = hex(250.0, 250.0, 251.0), c1 = hex(220.0, 221.0, 226.0), c2 = hex(182.0, 184.0, 192.0);
  vec3 c3 = hex(233.0, 233.0, 238.0), c4 = hex(201.0, 202.0, 209.0);
  if (t < 0.38) return mix(c0, c1, clamp(t / 0.38, 0.0, 1.0));
  if (t < 0.64) return mix(c1, c2, (t - 0.38) / 0.26);
  if (t < 0.86) return mix(c2, c3, (t - 0.64) / 0.22);
  return mix(c3, c4, clamp((t - 0.86) / 0.14, 0.0, 1.0));
}

// Gaussian-ish blurred coverage of a shape with distance d; blur = CSS blur radius.
float blurredCover(float d, float blur) { return 1.0 - smoothstep(-blur, blur, d); }

vec4 over(vec4 top, vec3 base) { return vec4(mix(base, top.rgb, top.a), 1.0); }

/**
 * Colour of the placeholder body (background layers, inset shadows, sheen,
 * iridescent rim) at box position b. Returns body colour; face drawn separately.
 */
vec3 shadeBuddyCard(vec2 b, vec2 size, float d) {
  float W = size.x, H = size.y, em = W / 10.0;

  // Layer 3 (bottom): linear gradient.
  vec3 col = bodyBase(cssLinearT(b, size, 158.0));
  // Layer 2: radial-gradient(90% 70% at 78% 92%, rgba(118,122,136,.55), transparent 60%)
  float t2 = length((b - vec2(0.78 * W, 0.92 * H)) / vec2(0.9 * W, 0.7 * H));
  col = mix(col, hex(118.0, 122.0, 136.0), 0.55 * clamp(1.0 - t2 / 0.6, 0.0, 1.0));
  // Layer 1 (top): radial-gradient(120% 90% at 26% 18%, #fff 0 22%, transparent 46%)
  float t1 = length((b - vec2(0.26 * W, 0.18 * H)) / vec2(1.2 * W, 0.9 * H));
  col = mix(col, vec3(1.0), clamp((0.46 - t1) / 0.24, 0.0, 1.0));

  // Inset shadows (painted over the background; first listed on top).
  // inset 0.25em 0.3em 0.6em rgba(255,255,255,.9)
  float dLight = sdBuddyShape(b - vec2(0.25, 0.3) * em, size);
  float light = 0.9 * (1.0 - blurredCover(dLight, 0.6 * em));
  // inset -0.35em -0.45em 0.9em rgba(64,66,78,.28)
  float dDark = sdBuddyShape(b - vec2(-0.35, -0.45) * em, size);
  float dark = 0.28 * (1.0 - blurredCover(dDark, 0.9 * em));
  col = mix(col, hex(64.0, 66.0, 78.0), dark);
  col = mix(col, vec3(1.0), light);

  // Sheen: top 10% left 16%, 34% x 16%, radial closest-side white .95, rotate(-18deg)
  vec2 sc = vec2(0.16 * W + 0.17 * W, 0.10 * H + 0.08 * H);
  vec2 sp = b - sc;
  float ca = cos(radians(18.0)), sa = sin(radians(18.0));
  sp = vec2(ca * sp.x - sa * sp.y, sa * sp.x + ca * sp.y);
  float ts = length(sp / vec2(0.17 * W, 0.08 * H));
  col = mix(col, vec3(1.0), 0.95 * clamp(1.0 - ts, 0.0, 1.0));

  // Iridescent rim: 0.09em ring, conic-gradient from 210deg, opacity .55
  float ring = step(-0.09 * em, d);
  vec2 cp = b - size * 0.5;
  float ang = mod(degrees(atan(cp.x, -cp.y)) - 210.0 + 720.0, 360.0) / 360.0;
  vec4 k0 = vec4(hex(255.0, 190.0, 220.0), 0.5), k1 = vec4(hex(170.0, 220.0, 255.0), 0.5);
  vec4 k2 = vec4(hex(210.0, 255.0, 220.0), 0.45), k3 = vec4(hex(255.0, 230.0, 170.0), 0.45);
  float s = ang * 4.0;
  vec4 rim = s < 1.0 ? mix(k0, k1, s) : s < 2.0 ? mix(k1, k2, s - 1.0) : s < 3.0 ? mix(k2, k3, s - 2.0) : mix(k3, k0, s - 3.0);
  col = mix(col, rim.rgb, rim.a * 0.55 * ring);

  return col;
}

// Outer drop shadow: 0 0.9em 1.4em -0.7em rgba(30,32,40,.28)
float buddyCardShadow(vec2 b, vec2 size) {
  float em = size.x / 10.0;
  float d = sdBuddyShape(b - vec2(0.0, 0.9 * em), size) + 0.7 * em;
  return 0.28 * blurredCover(d, 1.4 * em);
}
`;
