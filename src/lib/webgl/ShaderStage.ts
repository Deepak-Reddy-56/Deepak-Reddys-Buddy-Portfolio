/**
 * ShaderStage — a tiny, dependency-free WebGL renderer for full-viewport
 * procedural shaders (one quad, one fragment program).
 *
 * Owns the full lifecycle so scenes don't have to:
 * - device-pixel-ratio capping (lower on small / coarse-pointer screens)
 * - resize via ResizeObserver
 * - drawing on demand (callers drive frames with FrameLoop, so the canvas only
 *   renders while an animation is actually running)
 * - context-loss reporting and full disposal of GPU resources
 *
 * The GLSL chunks it runs (src/lib/webgl/glsl) are engine-agnostic so they can
 * be reused inside a three.js ShaderMaterial for the 3D Buddy in M3.
 */
export type UniformValue = number | readonly [number, number] | readonly [number, number, number] | readonly [number, number, number, number];

export type StageOptions = {
  /** Upper bound for devicePixelRatio. */
  maxDpr?: number;
  /** Lower bound used on small or coarse-pointer screens. */
  mobileMaxDpr?: number;
  onContextLost?: () => void;
};

const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

export class ShaderStage {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private buffer: WebGLBuffer;
  private uniforms = new Map<string, WebGLUniformLocation | null>();
  private resizeObserver: ResizeObserver;
  private disposed = false;
  private options: Required<Omit<StageOptions, 'onContextLost'>> & Pick<StageOptions, 'onContextLost'>;

  /** Canvas size in CSS pixels. */
  width = 0;
  height = 0;
  dpr = 1;

  /** Throws if WebGL is unavailable or the shader fails to compile. */
  constructor(canvas: HTMLCanvasElement, fragmentSource: string, options: StageOptions = {}) {
    this.canvas = canvas;
    this.options = { maxDpr: 1.75, mobileMaxDpr: 1.25, ...options };

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL unavailable');
    this.gl = gl;
    // Listen before compilation: a lost context makes WebGL object queries return null/false.
    canvas.addEventListener('webglcontextlost', this.handleContextLost, false);

    this.program = this.createProgram(VERTEX, fragmentSource);
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Could not allocate buffer');
    this.buffer = buffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one oversized triangle
    const position = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(this.program);
    gl.clearColor(0, 0, 0, 0);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();
  }

  set(name: string, value: UniformValue): void {
    let location = this.uniforms.get(name);
    if (location === undefined) {
      location = this.gl.getUniformLocation(this.program, name);
      this.uniforms.set(name, location);
    }
    if (location === null) return;
    const gl = this.gl;
    if (typeof value === 'number') gl.uniform1f(location, value);
    else if (value.length === 2) gl.uniform2f(location, value[0], value[1]);
    else if (value.length === 3) gl.uniform3f(location, value[0], value[1], value[2]);
    else gl.uniform4f(location, value[0], value[1], value[2], value[3]);
  }

  /** Read one CSS-pixel sample from the last completed frame (origin top-left). */
  readPixelCss(x: number, y: number): Uint8Array {
    if (this.disposed) throw new Error('Cannot read a disposed shader stage');
    if (this.canvas.width < 1 || this.canvas.height < 1) throw new Error('Shader canvas has no drawing buffer');
    const pixel = new Uint8Array(4);
    const px = Math.max(0, Math.min(this.canvas.width - 1, Math.round(x * this.dpr)));
    const py = Math.max(0, Math.min(this.canvas.height - 1, this.canvas.height - 1 - Math.round(y * this.dpr)));
    this.gl.finish();
    this.gl.readPixels(px, py, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
    const error = this.gl.getError();
    if (error !== this.gl.NO_ERROR) throw new Error('WebGL pixel readback failed (0x' + error.toString(16) + ')');
    return pixel;
  }

  /** Render one frame with the current uniforms. */
  draw(): void {
    if (this.disposed) return;
    const gl = this.gl;
    this.set('u_resolution', [this.canvas.width, this.canvas.height]);
    this.set('u_dpr', this.dpr);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost);
    const gl = this.gl;
    gl.deleteBuffer(this.buffer);
    gl.deleteProgram(this.program);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }

  private handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.options.onContextLost?.();
  };

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const small = Math.min(window.innerWidth, window.innerHeight) < 700 || window.matchMedia('(pointer: coarse)').matches;
    const cap = small ? this.options.mobileMaxDpr : this.options.maxDpr;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.width = rect.width;
    this.height = rect.height;
    const w = Math.max(1, Math.round(rect.width * this.dpr));
    const h = Math.max(1, Math.round(rect.height * this.dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const gl = this.gl;

    const sourceContext = (source: string, log: string | null): string => {
      const match = log?.match(/(?:ERROR:\s*)?\d+:(\d+)/i);
      const errorLine = match ? Number(match[1]) : 1;
      const lines = source.split('\n');
      const start = Math.max(1, errorLine - 3);
      const end = Math.min(lines.length, errorLine + 3);
      return lines
        .slice(start - 1, end)
        .map((line, index) => String(start + index).padStart(4, ' ') + ' | ' + line)
        .join('\n');
    };

    const compile = (type: number, label: string, source: string): WebGLShader => {
      const shader = gl.createShader(type);
      if (!shader) {
        const lost = gl.isContextLost();
        throw new Error(lost
          ? 'WebGL context was lost before creating the ' + label + ' shader.'
          : 'WebGL could not allocate the ' + label + ' shader object.');
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const contextLost = gl.isContextLost();
        const glError = gl.getError();
        const log = contextLost ? null : gl.getShaderInfoLog(shader);

        if (contextLost || glError === gl.CONTEXT_LOST_WEBGL) {
          gl.deleteShader(shader);
          throw new Error(
            'WebGL context was lost while compiling the ' + label + ' shader ' +
            '(CONTEXT_LOST_WEBGL). The browser may have reclaimed a GPU context; ' +
            'this is not a GLSL syntax diagnostic.'
          );
        }

        const version = String(gl.getParameter(gl.VERSION) ?? 'unavailable');
        const shadingLanguage = String(gl.getParameter(gl.SHADING_LANGUAGE_VERSION) ?? 'unavailable');
        const detail = log?.trim() || 'The driver returned an empty compiler log.';
        const context = sourceContext(source, log);
        gl.deleteShader(shader);
        throw new Error(
          label + ' shader compilation failed.\n' +
          detail + '\n' +
          'WebGL: ' + version + ' | GLSL: ' + shadingLanguage + ' | GL error: 0x' + glError.toString(16) + '\n' +
          'Source near reported line:\n' + context
        );
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, 'vertex', vertexSource);
    let fragment: WebGLShader;
    try {
      fragment = compile(gl.FRAGMENT_SHADER, 'fragment', fragmentSource);
    } catch (error) {
      gl.deleteShader(vertex);
      throw error;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      throw new Error(gl.isContextLost()
        ? 'WebGL context was lost before linking the Liquid Chrome program.'
        : 'Could not allocate the Liquid Chrome shader program.');
    }

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const contextLost = gl.isContextLost();
      const glError = gl.getError();
      const log = contextLost ? null : gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      if (contextLost || glError === gl.CONTEXT_LOST_WEBGL) {
        throw new Error('WebGL context was lost while linking the Liquid Chrome program (CONTEXT_LOST_WEBGL).');
      }
      throw new Error(
        'Liquid Chrome program link failed: ' + (log?.trim() || 'The driver returned an empty linker log.') +
        ' (GL error 0x' + glError.toString(16) + ').'
      );
    }

    return program;
  }
}
}

/** Cheap capability probe; does not keep a context alive. */
export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
