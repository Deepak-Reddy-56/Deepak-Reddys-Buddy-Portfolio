/**
 * Reusable GLSL chunks for the liquid-chrome material. Plain GLSL ES 1.0, no
 * engine assumptions: usable in ShaderStage now and in a three.js
 * ShaderMaterial for the 3D Buddy (M3).
 *
 * Convention: N is a unit normal with +y = screen up, +z = towards viewer.
 */

export const glslNoise = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  return valueNoise(p) * 0.65 + valueNoise(p * 2.03 + 17.1) * 0.35;
}
`;

export const glslSdf = /* glsl */ `
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

// Scaled-circle ellipse distance: well-defined everywhere (including the
// centre, which height-profile shading needs); exact for circles.
float sdEllipse(vec2 p, vec2 ab) {
  return (length(p / ab) - 1.0) * min(ab.x, ab.y);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
`;

/** Procedural studio environment — no textures, no network. */
export const glslChrome = /* glsl */ `
vec3 studioEnv(vec3 r, float t) {
  // One continuous gradient (no horizon line): a soft floor rising to a bright
  // sky, its boundary gently warped so reflections stay organic.
  float warp = 0.22 * sin(r.x * 2.1 + t * 0.35) + 0.12 * sin(r.x * 4.7 - r.y * 1.3 - t * 0.5);
  float y = r.y + warp;
  vec3 c = mix(vec3(0.36, 0.37, 0.42), vec3(0.98, 0.98, 0.99), smoothstep(-0.95, 0.9, y));
  // Broad, low-contrast light bands that drift — liquid, never a seam.
  float band = sin(dot(r.xy, vec2(2.6, 3.4)) + 1.6 * sin(r.x * 1.9 - t * 0.45) + t * 0.25);
  c += 0.08 * band * (1.0 - 0.5 * abs(r.y));
  // Soft box, upper left; thin rim light, right.
  c += 0.55 * smoothstep(0.80, 0.98, dot(r, normalize(vec3(-0.55, 0.7, 0.45))));
  c += 0.22 * smoothstep(0.65, 0.93, dot(r, normalize(vec3(0.95, -0.05, 0.3))));
  return c;
}

vec3 iridescence(float facing, float shift) {
  return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + facing * 1.6 + shift));
}

/** Chrome shading for a normal N. 'iri' scales the thin-film rainbow at grazing angles. */
vec3 shadeChrome(vec3 N, float t, float iri, float shift) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), N);
  vec3 col = studioEnv(r, t) * vec3(0.95, 0.96, 1.0);
  float grazing = 1.0 - N.z;
  col += (iridescence(grazing, shift) - 0.5) * 0.14 * smoothstep(0.15, 0.9, grazing) * iri;
  col = mix(col, vec3(1.0), pow(grazing, 4.0) * 0.18);
  return col;
}
`;
