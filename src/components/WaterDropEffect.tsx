import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/* ══════════ GLSL Shaders ══════════ */

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const DROP_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_strength;
void main() {
  vec4 info = texture2D(u_tex, v_uv);
  float d = max(0.0, 1.0 - length(v_uv - u_center) / u_radius);
  d = 0.5 - cos(d * 3.14159265) * 0.5;
  info.r += d * u_strength;
  gl_FragColor = info;
}`;

const UPDATE_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_delta;
void main() {
  vec4 info = texture2D(u_tex, v_uv);
  float avg = (
    texture2D(u_tex, v_uv + vec2(u_delta.x, 0.0)).r +
    texture2D(u_tex, v_uv - vec2(u_delta.x, 0.0)).r +
    texture2D(u_tex, v_uv + vec2(0.0, u_delta.y)).r +
    texture2D(u_tex, v_uv - vec2(0.0, u_delta.y)).r
  ) * 0.25;
  info.g += (avg - info.r) * 2.0;
  info.g *= 0.985;
  info.r += info.g;
  gl_FragColor = info;
}`;

const RENDER_FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_delta;
uniform float u_dark;
uniform float u_time;

float wave(vec2 p, float t) {
  float w = 0.0;
  w += sin(p.x * 4.0 + t * 0.7) * 0.5;
  w += sin(p.y * 5.0 - t * 0.5) * 0.4;
  w += sin((p.x + p.y) * 3.5 + t * 0.9) * 0.35;
  w += sin((p.x - p.y) * 6.0 - t * 0.6) * 0.25;
  w += sin(p.x * 9.0 + p.y * 7.0 + t * 1.1) * 0.18;
  w += sin(p.x * 12.0 - p.y * 11.0 - t * 0.8) * 0.12;
  w += sin(p.y * 14.0 + t * 1.3) * 0.08;
  return w;
}

float causticPattern(vec2 p, float t) {
  float c = 0.0;
  c += sin(p.x * 8.0 + t * 1.2) * sin(p.y * 6.0 - t * 0.9);
  c += sin(p.x * 5.0 - p.y * 7.0 + t * 0.7) * 0.6;
  c += sin((p.x + p.y) * 10.0 + t * 1.5) * 0.4;
  c = abs(c);
  c = pow(c * 0.28, 2.0);
  return c;
}

void main() {
  float t = u_time;

  float hL = texture2D(u_tex, v_uv - vec2(u_delta.x, 0.0)).r;
  float hR = texture2D(u_tex, v_uv + vec2(u_delta.x, 0.0)).r;
  float hT = texture2D(u_tex, v_uv - vec2(0.0, u_delta.y)).r;
  float hB = texture2D(u_tex, v_uv + vec2(0.0, u_delta.y)).r;
  vec2 simN = vec2(hL - hR, hT - hB);

  float eps = 0.004;
  float hC = wave(v_uv, t);
  float hRw = wave(v_uv + vec2(eps, 0.0), t);
  float hUw = wave(v_uv + vec2(0.0, eps), t);
  vec2 waterN = vec2(hC - hRw, hC - hUw) / eps * 0.005;

  vec2 totalN = waterN + simN * 2.0;
  vec2 ruv = clamp(v_uv + totalN * 0.018, 0.0, 1.0);

  float depth = wave(ruv * 0.6, t * 0.25) * 0.5 + 0.5;
  float caustic = causticPattern(ruv * 2.0, t * 0.8);

  vec3 color;

  if (u_dark > 0.5) {
    vec3 deep    = vec3(0.008, 0.030, 0.095);
    vec3 mid     = vec3(0.030, 0.100, 0.240);
    vec3 shallow = vec3(0.060, 0.200, 0.420);
    vec3 cLight  = vec3(0.120, 0.320, 0.600);

    color = mix(deep, mid, depth);
    color += (shallow - mid) * caustic * 0.6;
    color += cLight * caustic * 0.25;

    float simCaustic = length(simN) * 5.0;
    color += vec3(0.08, 0.22, 0.48) * simCaustic;
    color += vec3(0.15, 0.30, 0.55) * pow(simCaustic, 3.0) * 0.3;

    float foam = smoothstep(0.6, 1.0, depth) * 0.04;
    color += vec3(foam);

    float spec = pow(max(length(totalN) * 25.0, 0.0), 4.0) * 0.08;
    color += vec3(0.3, 0.5, 0.7) * spec;
  } else {
    vec3 deep    = vec3(0.68, 0.84, 0.94);
    vec3 mid     = vec3(0.76, 0.89, 0.96);
    vec3 shallow = vec3(0.82, 0.93, 0.98);
    vec3 cLight  = vec3(0.90, 0.96, 1.00);

    color = mix(deep, mid, depth);
    color += (shallow - mid) * caustic * 0.3;
    color += cLight * caustic * 0.06;

    float simCaustic = length(simN) * 3.0;
    color += vec3(0.06, 0.10, 0.14) * simCaustic * 0.25;
    color += vec3(1.0) * pow(simCaustic, 3.0) * 0.03;

    float foam = smoothstep(0.8, 1.0, depth) * 0.015;
    color += vec3(foam);

    float spec = pow(max(length(totalN) * 14.0, 0.0), 4.0) * 0.02;
    color += vec3(1.0) * spec;
  }

  gl_FragColor = vec4(color, 1.0);
}`;

/* ══════════ WebGL Helpers ══════════ */

function compileShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('Shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function buildProgram(gl: WebGLRenderingContext, fragSrc: string) {
  const v = compileShader(gl, gl.VERTEX_SHADER, VERT);
  const f = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  if (!v || !f) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.warn('Link:', gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

function uniformLocs(gl: WebGLRenderingContext, prog: WebGLProgram, names: string[]) {
  const m: Record<string, WebGLUniformLocation | null> = {};
  for (const n of names) m[n] = gl.getUniformLocation(prog, n);
  return m;
}

/* ══════════ Component ══════════ */

export default function WaterDropEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const animRef = useRef(0);
  const pendingDrops = useRef<{ x: number; y: number; r: number; s: number }[]>([]);
  const lastDropTime = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    const ext = gl.getExtension('OES_texture_float');
    gl.getExtension('OES_texture_float_linear');
    if (!ext) return;

    const SIM = 256;

    const dropProg = buildProgram(gl, DROP_FRAG);
    const updateProg = buildProgram(gl, UPDATE_FRAG);
    const renderProg = buildProgram(gl, RENDER_FRAG);
    if (!dropProg || !updateProg || !renderProg) return;

    const dU = uniformLocs(gl, dropProg, ['u_tex', 'u_center', 'u_radius', 'u_strength']);
    const uU = uniformLocs(gl, updateProg, ['u_tex', 'u_delta']);
    const rU = uniformLocs(gl, renderProg, ['u_tex', 'u_delta', 'u_dark', 'u_time']);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const textures: WebGLTexture[] = [];
    const fbos: WebGLFramebuffer[] = [];
    for (let i = 0; i < 2; i++) {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SIM, SIM, 0, gl.RGBA, gl.FLOAT, null);
      textures.push(tex);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      fbos.push(fbo);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    let cur = 0;
    const delta: [number, number] = [1 / SIM, 1 / SIM];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastDropTime.current < 25) return;
      lastDropTime.current = now;
      pendingDrops.current.push({
        x: e.clientX / window.innerWidth,
        y: 1 - e.clientY / window.innerHeight,
        r: 0.03, s: 0.04,
      });
    };
    const handleTouch = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastDropTime.current < 25) return;
      lastDropTime.current = now;
      const t = e.touches[0];
      if (!t) return;
      pendingDrops.current.push({
        x: t.clientX / window.innerWidth,
        y: 1 - t.clientY / window.innerHeight,
        r: 0.035, s: 0.05,
      });
    };
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch, { passive: true });

    function use(prog: WebGLProgram) {
      gl!.useProgram(prog);
      const loc = gl!.getAttribLocation(prog, 'a_pos');
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
      gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(loc);
    }
    function quad() { gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4); }

    const loop = () => {
      while (pendingDrops.current.length > 0) {
        const d = pendingDrops.current.shift()!;
        const next = 1 - cur;
        gl!.viewport(0, 0, SIM, SIM);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbos[next]);
        use(dropProg!);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, textures[cur]);
        gl!.uniform1i(dU['u_tex'], 0);
        gl!.uniform2f(dU['u_center'], d.x, d.y);
        gl!.uniform1f(dU['u_radius'], d.r);
        gl!.uniform1f(dU['u_strength'], d.s);
        quad();
        cur = next;
      }

      for (let i = 0; i < 3; i++) {
        const next = 1 - cur;
        gl!.viewport(0, 0, SIM, SIM);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbos[next]);
        use(updateProg!);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, textures[cur]);
        gl!.uniform1i(uU['u_tex'], 0);
        gl!.uniform2f(uU['u_delta'], delta[0], delta[1]);
        quad();
        cur = next;
      }

      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.viewport(0, 0, canvas.width, canvas.height);
      use(renderProg!);
      gl!.activeTexture(gl!.TEXTURE0);
      gl!.bindTexture(gl!.TEXTURE_2D, textures[cur]);
      gl!.uniform1i(rU['u_tex'], 0);
      gl!.uniform2f(rU['u_delta'], delta[0], delta[1]);
      gl!.uniform1f(rU['u_dark'], themeRef.current === 'dark' ? 1.0 : 0.0);
      gl!.uniform1f(rU['u_time'], (performance.now() - startTime.current) / 1000.0);
      quad();

      animRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  );
}
