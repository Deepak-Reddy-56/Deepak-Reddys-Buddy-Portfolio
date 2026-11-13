import {
  BackSide,
  Mesh,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';

/**
 * A procedural photo-studio environment (no HDRI, no network), pre-filtered
 * once with PMREM and used for all chrome reflections:
 *  - a bright pearl sky over a dark floor, with a few gently warped dark
 *    ribbons (what makes polished chrome read as metal rather than plastic);
 *  - crisp rectangular softboxes (key, top strip, right rim, fill) that show up
 *    as the clean highlight patches of a product shot;
 *  - two pale gel panels behind him (cyan / rose) that only reflect at
 *    grazing angles, giving the rim a subtle iridescent edge.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene();

  const dome = new Mesh(
    new SphereGeometry(50, 64, 32),
    new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          float az = atan(vDir.z, vDir.x);
          float y = vDir.y + 0.10 * sin(az * 2.0 + 0.6);
          // pearl sky above; a mid-grey floor that brightens towards the white tabletop under him
          vec3 sky = vec3(1.04, 1.04, 1.06);
          vec3 floorC = mix(vec3(0.20, 0.205, 0.23), vec3(0.80, 0.80, 0.82), smoothstep(-0.35, -0.95, y));
          vec3 c = mix(floorC, sky, smoothstep(-0.30, 0.25, y));
          // one defined horizon ribbon (dark, soft-edged): the line chrome is recognised by
          c *= 1.0 - 0.8 * exp(-pow((y + 0.02) / 0.075, 2.0));
          // two gently warped dark ribbons in the upper sky: liquid, not striped
          float w = y * 1.4 + 0.5 * sin(az * 2.0 + y * 3.0);
          float ribbon = smoothstep(0.86, 0.97, abs(sin(w * 3.14159)));
          c = mix(c, c * 0.5, ribbon * smoothstep(0.12, 0.3, y) * (1.0 - smoothstep(0.6, 0.85, y)));
          gl_FragColor = vec4(c, 1.0);
        }`,
    }),
  );
  scene.add(dome);

  const panel = (w: number, h: number, rgb: [number, number, number], x: number, y: number, z: number, crisp = 0.86) => {
    const mesh = new Mesh(
      new PlaneGeometry(w, h),
      new ShaderMaterial({
        depthWrite: false,
        vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vec2 d = abs(vUv - 0.5) * 2.0;
            float edge = 1.0 - smoothstep(${crisp.toFixed(2)}, 1.0, max(d.x, d.y));
            gl_FragColor = vec4(vec3(${rgb.map((v) => v.toFixed(2)).join(', ')}) * edge, 1.0);
          }`,
      }),
    );
    mesh.position.set(x, y, z);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  };
  panel(24, 14, [4.6, 4.6, 4.7], -22, 22, 24); // key, upper left (the CSS placeholder's highlight)
  panel(44, 4.5, [3.0, 3.0, 3.1], 0, 34, 4); // long top strip
  panel(5, 26, [2.8, 2.8, 2.9], 32, 3, 8); // thin rim, right
  panel(9, 7, [1.3, 1.3, 1.35], -30, -4, 14, 0.7); // soft fill, low left
  panel(14, 30, [0.8, 1.35, 1.6], 26, 4, -26, 0.6); // cyan gel, behind right (grazing only)
  panel(14, 30, [1.6, 0.95, 1.3], -26, 4, -26, 0.6); // rose gel, behind left (grazing only)

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as ShaderMaterial).dispose();
    }
  });
  return texture;
}
