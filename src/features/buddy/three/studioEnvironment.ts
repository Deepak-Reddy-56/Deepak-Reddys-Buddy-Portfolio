import {
  BackSide,
  Mesh,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  type Texture,
  type WebGLRenderer,
} from 'three';

/**
 * Procedural liquid-chrome environment, generated locally and prefiltered once.
 * Warped reflection ribbons echo the reference Buddy: flowing black/silver
 * bands and restrained spectral colour, not rectangular product-photo panels.
 * The field is mirrored by studioBuddy() in the intro GLSL for a consistent handoff.
 */
export function createStudioEnvironment(renderer: WebGLRenderer): Texture {
  const scene = new Scene();
  const dome = new Mesh(
    new SphereGeometry(50, 96, 48),
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

        vec3 fluidStudio(vec3 direction) {
          float az = atan(direction.z, direction.x);
          float y = direction.y;
          float warped = y
            + 0.19 * sin(az * 2.15 + y * 3.1)
            + 0.085 * sin(az * 4.7 - y * 4.2)
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

        void main() {
          gl_FragColor = vec4(fluidStudio(normalize(vDir)), 1.0);
        }`,
    }),
  );
  scene.add(dome);

  const pmrem = new PMREMGenerator(renderer);
  const texture = pmrem.fromScene(scene, 0.02).texture;
  pmrem.dispose();
  scene.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      (object.material as ShaderMaterial).dispose();
    }
  });
  return texture;
}
