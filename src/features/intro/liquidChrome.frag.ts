import { glslBuddyCard } from '../../lib/webgl/glsl/buddyCard';
import { glslChrome, glslNoise, glslSdf } from '../../lib/webgl/glsl/chrome';

/**
 * One continuous object for the whole introduction:
 *   rounded box (the terminal, dark glass)  →  liquid chrome blob  →  Buddy,
 * ending as an exact image of the CSS placeholder so the DOM can take over.
 * All geometry uniforms are in CSS pixels, origin top-left.
 */
export const liquidChromeFragment = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;   // device px
uniform float u_dpr;
uniform float u_time;        // seconds
uniform vec2 u_center;       // css px
uniform vec2 u_half;         // css px (half width, half height)
uniform float u_radius;      // corner radius of the box state
uniform float u_morph;       // 0 box → 1 ellipse/pebble
uniform float u_liquid;      // surface agitation 0..1
uniform float u_drops;       // satellite droplets 0..1
uniform float u_chrome;      // 0 dark glass → 1 chrome
uniform float u_face;        // eyes/mouth 0..1 (scale, may overshoot)
uniform float u_blink;       // 0 open → 1 closed
uniform float u_settle;      // liquid chrome → exact placeholder look (hand-off)
uniform float u_alpha;

${glslNoise}
${glslSdf}
${glslChrome}
${glslBuddyCard}

float shape(vec2 q) {
  float minHalf = min(u_half.x, u_half.y);
  float d = mix(sdRoundBox(q, u_half, u_radius), sdEllipse(q, u_half), u_morph);

  if (u_drops > 0.001) {
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float a = u_time * (0.9 + fi * 0.35) + fi * 2.094;
      float reach = minHalf * (0.55 + 0.6 * u_drops);
      vec2 pos = vec2(cos(a), sin(a) * 0.82) * reach;
      float r = minHalf * (0.16 + 0.05 * sin(u_time * 2.1 + fi)) * u_drops;
      d = smin(d, length(q - pos) - r, 18.0 + 30.0 * u_drops);
    }
  }

  d += u_liquid * (fbm2(q * 0.009 + vec2(u_time * 0.5, -u_time * 0.35)) - 0.5) * 0.2 * minHalf;
  // Settle into the placeholder's exact silhouette.
  if (u_settle > 0.0) d = mix(d, sdBuddyShape(q + u_half, 2.0 * u_half), u_settle);
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_dpr;
  vec2 q = p - u_center;
  float minHalf = min(u_half.x, u_half.y);

  // Early out: most of the viewport is empty. Bounds cover droplets and shadow.
  vec2 reach = u_half + minHalf * 1.25 * u_drops + 48.0;
  if (abs(q.x) > reach.x || q.y < -reach.y || q.y > reach.y + u_half.y * 0.7 + 40.0) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float d = shape(q);
  float aa = 0.75 / u_dpr;
  float alpha = clamp(0.5 - d / aa * 0.5, 0.0, 1.0);

  // Soft contact shadow, easing into the placeholder's drop shadow.
  vec2 qs = q - vec2(0.0, mix(16.0, u_half.y * 0.6, u_morph));
  float ds = mix(sdRoundBox(qs, u_half * vec2(0.95, 0.9), u_radius), sdEllipse(qs, u_half * vec2(0.84, 0.5)), u_morph);
  float blur = mix(28.0, 16.0, u_morph);
  float shadow = mix(0.10, 0.16, u_morph) * (1.0 - smoothstep(-blur, blur, ds));
  shadow = mix(shadow, buddyCardShadow(q + u_half, 2.0 * u_half), u_settle);

  vec3 color = vec3(0.0);
  if (alpha > 0.0) {
    // Height profile → normal ("inflated" 2.5D surface).
    float e = 1.5;
    vec2 grad = vec2(shape(q + vec2(e, 0.0)) - shape(q - vec2(e, 0.0)),
                     shape(q + vec2(0.0, e)) - shape(q - vec2(0.0, e))) / (2.0 * e);
    float bevel = mix(9.0, minHalf * 1.08, u_morph); // > depth: no flat plateau
    float x = clamp(-d / bevel, 0.0, 1.0);
    float slope = (1.0 - x) / sqrt(max(1.0 - (1.0 - x) * (1.0 - x), 0.004));
    vec2 tilt = grad * slope;
    tilt += u_liquid * 0.3 * (vec2(fbm2(q * 0.008 + u_time * 0.6), fbm2(q * 0.008 - u_time * 0.5 + 9.0)) - 0.5);
    vec3 N = normalize(vec3(tilt.x, -tilt.y, 1.0));

    vec3 chrome = shadeChrome(N, u_time, 1.0, q.x * 0.0015 + u_time * 0.04);
    vec3 r = reflect(vec3(0.0, 0.0, -1.0), N);
    vec3 glass = vec3(0.082, 0.082, 0.09) + studioEnv(r, u_time) * 0.045 + 0.03 * smoothstep(0.3, 1.0, -q.y / u_half.y);
    color = mix(glass, chrome, u_chrome);
    if (u_settle > 0.0) color = mix(color, shadeBuddyCard(q + u_half, 2.0 * u_half, d), u_settle);

    // Face: proportions mirror the CSS placeholder so the hand-off is seamless.
    if (u_face > 0.001) {
      float w = 2.0 * u_half.x;
      vec2 uv = q / w;
      float faa = 1.0 / (w * u_dpr);
      float open = max(1.0 - u_blink, 0.08);
      vec2 eyeR = vec2(0.056, 0.081 * open) * u_face;
      float eyes = 1.0;
      float shine = 0.0;
      for (int i = 0; i < 2; i++) {
        float s = i == 0 ? -1.0 : 1.0;
        vec2 c = vec2(0.014 + s * 0.1185, -0.0706);
        vec2 ep = uv - c;
        float de = sdEllipse(ep, max(eyeR, vec2(1e-4)));
        eyes = min(eyes, smoothstep(-faa, faa, de));
        float dh = sdEllipse(ep - vec2(0.016, -0.036 * open) * u_face, max(vec2(0.02, 0.023 * open) * u_face, vec2(1e-4)));
        shine = max(shine, 1.0 - smoothstep(-faa, faa, dh));
      }
      // radial-gradient(120% 100% at 50% 30%, #2a2a2e, #050506 70%) per eye
      float side = uv.x < 0.014 ? -1.0 : 1.0;
      vec2 ec = vec2(0.014 + side * 0.1185, -0.0706 - 0.0324);
      float te = length((uv - ec) / vec2(0.1344, 0.162));
      vec3 eyeColor = mix(hex(42.0, 42.0, 46.0), hex(5.0, 5.0, 6.0), clamp(te / 0.7, 0.0, 1.0));
      color = mix(eyeColor, color, eyes);
      color = mix(color, vec3(1.0), shine * (1.0 - eyes) * step(0.3, open));

      // Mouth: 0.9em x 0.42em box, 0.13em border, no top border, rounded bottom → a U.
      vec2 m = (uv - vec2(0.014, 0.0424)) / max(u_face, 1e-3);
      float outer = sdEllipse(m, vec2(0.045, 0.042));
      float inner = sdEllipse(m, vec2(0.032, 0.029));
      float mouth = (1.0 - smoothstep(-faa, faa, outer)) * smoothstep(-faa, faa, inner) * step(0.0, m.y);
      color = mix(color, hex(13.0, 13.0, 15.0), mouth * clamp(u_face, 0.0, 1.0));
    }
  }

  float a = alpha + shadow * (1.0 - alpha);
  gl_FragColor = vec4(color * alpha, a) * u_alpha;
}
`;
