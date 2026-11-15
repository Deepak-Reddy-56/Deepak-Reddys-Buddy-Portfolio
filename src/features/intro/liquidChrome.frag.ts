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
uniform float u_chrome;      // 0 dark glass → 1 chrome
uniform float u_face;        // eyes form 0..1
uniform float u_smile;       // smile forms after the eyes 0..1
uniform float u_blink;       // 0 open → 1 closed
uniform float u_settle;      // liquid chrome → exact placeholder look (hand-off)
uniform float u_talk;        // 0..1 mouth opening while Buddy speaks
uniform float u_alpha;

${glslNoise}
${glslSdf}
${glslChrome}
${glslBuddyCard}

float shape(vec2 q) {
  float minHalf = min(u_half.x, u_half.y);
  // One continuous volume: a rounded terminal profile becomes a solid pebble.
  float d = mix(sdRoundBox(q, u_half, u_radius), sdEllipse(q, u_half), u_morph);

  // Surface tension creates a few pixels of living metal, never detached drops.
  d += u_liquid * (fbm2(q * 0.009 + vec2(u_time * 0.5, -u_time * 0.35)) - 0.5) * 0.04 * minHalf;
  // Settle into the placeholder's exact silhouette.
  if (u_settle > 0.0) d = mix(d, sdBuddyShape(q + u_half, 2.0 * u_half), u_settle);
  return d;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y) / u_dpr;
  vec2 q = p - u_center;
  float minHalf = min(u_half.x, u_half.y);

  // Early out: most of the viewport is empty. Bounds cover droplets and shadow.
  vec2 reach = u_half + 48.0;
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
    tilt += u_liquid * 0.16 * (vec2(fbm2(q * 0.008 + u_time * 0.6), fbm2(q * 0.008 - u_time * 0.5 + 9.0)) - 0.5);
    vec3 N = normalize(vec3(tilt.x, -tilt.y, 1.0));

    vec3 chrome = shadeChrome(N, u_time, 1.15, q.x * 0.0018 + u_time * 0.06, u_face);
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
      vec2 eyeR = vec2(0.095, 0.136 * open) * u_face;
      float eyes = 1.0;
      float shine = 0.0;
      for (int i = 0; i < 2; i++) {
        vec2 c = i == 0 ? vec2(-0.25, -0.02) : vec2(0.075, -0.02);
        vec2 ep = uv - c;
        float de = sdEllipse(ep, max(eyeR, vec2(1e-4)));
        eyes = min(eyes, smoothstep(-faa, faa, de));
        float dh = sdEllipse(ep - vec2(0.022, -0.045 * open) * u_face, max(vec2(0.03, 0.043 * open) * u_face, vec2(1e-4)));
        shine = max(shine, 1.0 - smoothstep(-faa, faa, dh));
      }
      // radial-gradient(120% 100% at 50% 30%, #2a2a2e, #050506 70%) per eye
      vec2 ec = uv.x < -0.08 ? vec2(-0.25, -0.02) : vec2(0.075, -0.02);
      float te = length((uv - ec) / vec2(0.19, 0.27));
      vec3 eyeColor = mix(hex(42.0, 42.0, 46.0), hex(5.0, 5.0, 6.0), clamp(te / 0.7, 0.0, 1.0));
      color = mix(eyeColor, color, eyes);
      color = mix(color, vec3(1.0), shine * (1.0 - eyes) * step(0.3, open));

      // A separate oval nose sits between the eyes and the full curved smile.
      float noseD = sdEllipse(
        uv - vec2(-0.068, 0.175),
        max(vec2(0.072, 0.053) * u_face, vec2(1e-4))
      );
      float nose = 1.0 - smoothstep(-faa, faa, noseD);
      color = mix(color, hex(5.0, 5.0, 7.0), nose);

      // A wider, complete U-shaped smile; its open form follows Buddy's speech.
      if (u_smile > 0.001) {
        vec2 m = (uv - vec2(-0.06, 0.30)) / max(u_smile, 1e-3);
        float outer = sdEllipse(m, vec2(0.12, 0.055));
        float inner = sdEllipse(m, vec2(0.10, 0.040));
        float mouth = (1.0 - smoothstep(-faa, faa, outer)) * smoothstep(-faa, faa, inner) * step(0.0, m.y);
        float openMouth = 1.0 - smoothstep(-faa, faa, sdEllipse(m - vec2(0.0, 0.034), vec2(0.09, 0.006 + 0.025 * u_talk)));
        mouth = max(mouth, openMouth * step(0.02, u_talk));
        color = mix(color, hex(13.0, 13.0, 15.0), mouth * clamp(u_smile, 0.0, 1.0));
      }
    }
  }

  float a = alpha + shadow * (1.0 - alpha);
  gl_FragColor = vec4(color * alpha, a) * u_alpha;
}
`;
