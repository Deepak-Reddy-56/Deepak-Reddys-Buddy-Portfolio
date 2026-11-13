/**
 * Reusable GLSL chunks for the liquid-chrome material. Plain GLSL ES 1.0, no
 * engine assumptions: usable in ShaderStage now and in a three.js ShaderMaterial.
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

float sdEllipse(vec2 p, vec2 ab) {
  return (length(p / ab) - 1.0) * min(ab.x, ab.y);
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
`;

/** Shared reflection environment. Three.js uses the same static field for Buddy. */
export const glslChrome = /* glsl */ `
vec3 fluidStudio(vec3 direction, float t) {
  float az = atan(direction.z, direction.x);
  float y = direction.y;
  float warped = y
    + 0.19 * sin(az * 2.15 + y * 3.1 + t * 0.05)
    + 0.085 * sin(az * 4.7 - y * 4.2 - t * 0.035)
    + 0.028 * sin(az * 8.2 + y * 7.0);

  vec3 deep = vec3(0.035, 0.038, 0.052);
  vec3 silver = vec3(0.48, 0.50, 0.56);
  vec3 pearl = vec3(1.20, 1.19, 1.24);
  vec3 c = mix(deep, silver, smoothstep(-0.72, -0.04, warped));
  c = mix(c, pearl, smoothstep(-0.04, 0.64, warped));

  float phase = warped * 10.5
    + 0.48 * sin(az * 2.35 + warped * 4.1)
    + 0.12 * sin(az * 5.2 - warped * 2.7);
  float darkRibbon = pow(max(0.0, cos(phase)), 13.0);
  float brightRibbon = pow(max(0.0, cos(phase + 3.14159)), 17.0);
  c = mix(c, c * 0.105, darkRibbon * 0.76);
  c += vec3(0.42, 0.43, 0.48) * brightRibbon;

  float key = exp(-pow((warped - (0.54 + 0.105 * sin(az * 2.0))) / 0.16, 2.0));
  float lower = exp(-pow((warped - (-0.18 + 0.14 * sin(az * 2.05 + 0.8))) / 0.09, 2.0));
  c += vec3(0.40, 0.41, 0.46) * key;
  c = mix(c, c * 0.12, lower * 0.72);

  float filmLine = exp(-pow((warped - (-0.015 + 0.125 * sin(az * 2.2))) / 0.052, 2.0));
  vec3 spectrum = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + az * 0.09 + warped * 1.2));
  c = mix(c, spectrum * 1.32, filmLine * 0.64);
  return c;
}

vec3 studioEnv(vec3 r, float t) {
  return fluidStudio(r, t);
}

vec3 studioBuddy(vec3 r) {
  return fluidStudio(r, 0.0);
}

vec3 iridescence(float facing, float shift) {
  return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + facing * 1.6 + shift));
}

vec3 shadeChrome(vec3 N, float t, float iri, float shift, float studio) {
  vec3 r = reflect(vec3(0.0, 0.0, -1.0), N);
  vec3 liquid = studioEnv(r, t);
  vec3 product = studioBuddy(r);
  product = product / (1.0 + 0.22 * product);
  vec3 col = mix(liquid, product, studio);
  float grazing = 1.0 - N.z;
  col += (iridescence(grazing, shift) - 0.5) * 0.14 * smoothstep(0.15, 0.9, grazing) * iri;
  col = mix(col, vec3(1.0), pow(grazing, 4.0) * 0.18);
  return col;
}
`;
