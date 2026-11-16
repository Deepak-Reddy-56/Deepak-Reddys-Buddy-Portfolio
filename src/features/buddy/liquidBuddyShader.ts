import { liquidMetalFragmentShader } from '@paper-design/shaders';

/**
 * Buddy's body shader: Paper's Liquid Metal (Apache-2.0, © Paper Design,
 * https://github.com/paper-design/shaders) extended — not replaced — with:
 *
 *  - u_form (0→1): the terminal's rounded rectangle (u_box / u_boxRadius, in
 *    on-screen px) flows into Buddy's silhouette. At u_form = 1 the shape is
 *    exactly the processed mask, i.e. Paper's own image-mode path, so the
 *    terminal, the transition and the settled character are one surface;
 *  - u_shade: the dark band colour (Paper hard-codes 0.1), lifted so the
 *    chrome reads as bright silver like the reference instead of near-black;
 *  - a reduced small-canvas edge blur, so the small character keeps a crisp outline.
 *
 * The rest of Paper's material (stripes, distortion, chromatic shift, flow)
 * is untouched. Every patch is asserted, so a Paper upgrade that changes the
 * source fails loudly instead of silently rendering something else.
 */
function patch(source: string, find: string, replace: string): string {
  if (!source.includes(find)) {
    throw new Error('liquidBuddyShader: Paper Liquid Metal source changed; patch anchor not found: ' + find.slice(0, 60));
  }
  return source.replace(find, replace);
}

let shader = liquidMetalFragmentShader;

shader = patch(
  shader,
  'uniform bool u_isImage;',
  `uniform bool u_isImage;
uniform float u_form;
uniform float u_shade;
uniform vec2 u_box;
uniform float u_boxRadius;`,
);

// Formation: the terminal's rounded rectangle (in on-screen px) flowing into the
// silhouette's interior depth, with a gentle liquid wobble while it changes shape.
shader = patch(
  shader,
  '  float diagBLtoTR = rotatedUV.x - rotatedUV.y;',
  `  if (u_isImage == true && u_form < .999) {
    float gather = smoothstep(0., 1., u_form);
    vec2 p = (v_imageUV - .5) * u_box;
    vec2 halfBox = u_box * .5 - 1.5;
    float radius = min(u_boxRadius, min(halfBox.x, halfBox.y));
    vec2 q = abs(p) - halfBox + radius;
    float sd = length(max(q, 0.)) + min(max(q.x, q.y), 0.) - radius;
    float sRect = clamp(-sd / (.5 * min(u_box.x, u_box.y)), -.6, .6);
    float lt = u_time * .9;
    float wobble = .05 * gather * (1. - gather) * (sin(v_imageUV.x * 9. + lt * 3.1) + sin(v_imageUV.y * 7. - lt * 2.3));
    float depth = (1. - img.r) * img.g;
    float sBuddy = (img.g - .5) * .3 + depth * .5;
    float s = mix(sRect, sBuddy, gather) + wobble;
    float aa = max(fwidth(s), 1e-4) * 1.2;
    opacity = smoothstep(-aa, aa, s) * getImgFrame(v_imageUV, 0.);
    float edgeRect = pow(1. - clamp(sRect * 3.5, 0., 1.), 1.6) * smoothstep(0., .4, u_contour);
    edge = mix(edgeRect, edge, gather);
  }

  float diagBLtoTR = rotatedUV.x - rotatedUV.y;`,
);

shader = patch(
  shader,
  'vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, diagTLtoBR));',
  'vec3 color2 = vec3(u_shade, u_shade, u_shade + .1 * smoothstep(.7, 1.3, diagTLtoBR));',
);

// Paper blurs edges heavily on canvases under 500 px. Buddy is always small,
// so keep a fraction of it (stripes still anti-alias through fwidth) for a crisp outline.
shader = patch(
  shader,
  'float smallCanvasT = 1.0 - smoothstep(100., 500., min(u_resolution.x, u_resolution.y));',
  'float smallCanvasT = .2 * (1.0 - smoothstep(100., 500., min(u_resolution.x, u_resolution.y)));',
);

export const liquidBuddyFragmentShader = shader;
