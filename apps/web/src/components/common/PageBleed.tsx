'use client'

import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { RootPortal } from '../ui/portal'

const VERTEX = `#version 300 es
in vec2 aP;
void main(){ gl_Position = vec4(aP, 0.0, 1.0); }
`

/**
 * 天头水晕 (Ichimonji Bokashi — 一文字ぼかし)
 *
 * Two layered washi pigment washes hugging the top edge, modulated by
 * horizontal kozo-fiber tooth, soft pigment mottle, and a delicate capillary
 * tide-mark ("水痕") along the lower feathered contour. Unified across desktop
 * and mobile; seeps in once on load (~1.4s) and settles still (zero idle RAF).
 */
const BOKASHI_FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uDpr;
uniform float uProgress;
uniform float uSeed;
uniform vec3 uAccent;
uniform vec3 uAlphas; // x: pass1 wash, y: pass2 upper wash, z: capillary tide

float hash1(float n) {
  return fract(sin(n * 127.1 + 311.7) * 43758.5453123);
}

float hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise1(float x, float s) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash1(i + s * 97.3), hash1(i + 1.0 + s * 97.3), u);
}

float fbm1(float x, float s) {
  float v = 0.0;
  float a = 0.5;
  float freq = 1.0;
  float norm = 0.0;
  for (int i = 0; i < 4; i++) {
    v += a * noise1(x * freq, s + float(i) * 13.7);
    norm += a;
    a *= 0.5;
    freq *= 2.04;
  }
  return v / norm;
}

float vnoise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash2(i), hash2(i + vec2(1.0, 0.0)), u.x),
    mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise2(p);
    p = p * 2.03 + vec2(17.1, 9.2);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 uv = px / uRes;
  vec2 css = px / max(uDpr, 1.0);
  float H = uRes.y / max(uDpr, 1.0);

  // Asymmetric organic hake-brush bottom contours (in normalized [0..1] height)
  float tilt = sin(uv.x * 3.14159265 * 1.15 + uSeed * 6.2831853) * 0.095;
  float undul1 = (fbm1(uv.x * 2.8 + uSeed * 5.1, uSeed) - 0.5) * 0.28;
  float fine1 = (fbm1(uv.x * 14.0, uSeed + 2.3) - 0.5) * 0.055;
  float e1 = clamp(0.51 + tilt * 0.65 + undul1 + fine1, 0.30, 0.72);

  float undul2 = (fbm1(uv.x * 2.2 + uSeed * 3.7 + 1.9, uSeed + 4.1) - 0.5) * 0.24;
  float fine2 = (fbm1(uv.x * 11.0, uSeed + 6.8) - 0.5) * 0.048;
  float e2 = clamp(0.38 - tilt * 0.45 + undul2 + fine2, 0.22, 0.58);

  // Gentle top-down pigment seep on page open, staggered organically by paper grain
  float seepNoise = (fbm2(css / 140.0 + vec2(uSeed * 7.3, 1.9)) - 0.5) * 0.14;
  float reach = clamp(uProgress * 1.15 + seepNoise * (1.0 - uProgress), 0.0, 1.0);
  float e1Now = e1 * (0.35 + 0.65 * reach);
  float e2Now = e2 * (0.40 + 0.60 * reach);

  // Washi kozo-fiber horizontal tooth + soft watercolor mottle
  float tooth = 0.84 + 0.32 * vnoise2(vec2(css.x / 18.0 + uSeed * 19.0, css.y / 1.5));
  float mottle = 0.85 + 0.30 * fbm2(css / 88.0 + vec2(uSeed * 11.3, 3.1));

  // Pass 1: primary translucent watercolor wash + capillary tide-mark ("水痕")
  float d1 = (e1Now - uv.y) / 0.22;
  float s1 = smoothstep(-0.55, 1.0, d1);
  float topWeight = 0.56 + 0.44 * pow(clamp(1.0 - uv.y / max(e1Now, 0.05), 0.0, 1.0), 0.7);
  float edgeDistPx = (uv.y - e1Now) * H;
  float tideBreak = 0.52 + 0.48 * noise1(uv.x * 36.0 + uSeed * 7.7, uSeed + 3.4);
  float tide = exp(-(edgeDistPx * edgeDistPx) / 26.0) * uAlphas.z * tideBreak * reach;
  float a1 = s1 * topWeight * uAlphas.x * mottle + tide;

  // Pass 2: upper mineral wash hugging the top edge
  float d2 = (e2Now - uv.y) / 0.17;
  float s2 = smoothstep(-0.45, 1.0, d2);
  float a2 = s2 * uAlphas.y * (0.72 + 0.28 * mottle);

  // Faint kozo fiber wisps skimming near the wet capillary edge
  float wispField = vnoise2(vec2(css.x / 46.0 + uSeed * 5.7, css.y / 1.8));
  float wispMask = exp(-(edgeDistPx * edgeDistPx) / 480.0);
  float wisp = smoothstep(0.76, 0.94, wispField) * wispMask * uAlphas.z * 0.55 * reach;

  float combined = (a1 + a2 - a1 * a2 + wisp) * tooth;
  // Soft safety feather near the bottom of the 200px band so it never clips
  combined *= smoothstep(1.0, 0.74, uv.y) * smoothstep(0.0, 0.25, uProgress);

  // Subtle paper-grain dither to eliminate 8-bit banding
  float dither = (hash2(px + 0.37) - 0.5) / 255.0;
  float alpha = clamp(combined + dither, 0.0, 0.42);

  fragColor = vec4(uAccent, alpha);
}
`

const SEEP_DURATION_MS = 1400

const hslToRgb = (
  h: number,
  s: number,
  l: number,
): [number, number, number] => {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/** `--color-accent` 是每篇文章注入的 oklch()，交给 2d canvas 去转 sRGB */
const readColor = (
  name: string,
  fallback: [number, number, number],
): [number, number, number] => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
  if (!raw) return fallback
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return fallback
  ctx.fillStyle = '#000'
  ctx.fillStyle = raw
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  return shader
}

function mountBokashi(canvas: HTMLCanvasElement, hue: number, seed: number) {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
  })
  if (!gl) return () => {}

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl, gl.FRAGMENT_SHADER, BOKASHI_FRAGMENT)
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.bindAttribLocation(program, 0, 'aP')
  gl.linkProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.useProgram(program)

  const u = {
    res: gl.getUniformLocation(program, 'uRes'),
    dpr: gl.getUniformLocation(program, 'uDpr'),
    progress: gl.getUniformLocation(program, 'uProgress'),
    seed: gl.getUniformLocation(program, 'uSeed'),
    accent: gl.getUniformLocation(program, 'uAccent'),
    alphas: gl.getUniformLocation(program, 'uAlphas'),
  }

  const isDark = () =>
    document.documentElement.dataset.theme === 'dark' ||
    document.documentElement.classList.contains('dark')

  let accent: [number, number, number] = [0, 0, 0]
  let alphas: [number, number, number] = [0.11, 0.068, 0.062]

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let settled = reduceMotion.matches
  let start = 0
  let raf = 0

  const drawFrame = (progress: number) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.res, canvas.width, canvas.height)
    gl.uniform1f(u.dpr, dpr)
    gl.uniform1f(u.progress, progress)
    gl.uniform1f(u.seed, seed)
    gl.uniform3fv(u.accent, accent)
    gl.uniform3fv(u.alphas, alphas)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const syncAccent = () => {
    const dark = isDark()
    const raw = readColor(
      '--color-accent',
      hslToRgb(hue, 0.42, dark ? 0.64 : 0.48),
    )
    // Deepen high-lightness accents slightly on light paper so pastel OKLCH
    // hues read as mineral watercolor pigment rather than washing out on white.
    accent = dark ? raw : [raw[0] * 0.84, raw[1] * 0.82, raw[2] * 0.8]
    // [pass1 wash, pass2 upper veil, capillary tide-mark]
    alphas = dark ? [0.24, 0.135, 0.115] : [0.165, 0.095, 0.092]
    if (settled) drawFrame(1)
  }
  syncAccent()

  const themeObserver = new MutationObserver(syncAccent)
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class', 'style'],
  })

  const ro = new ResizeObserver(() => {
    if (settled) drawFrame(1)
  })
  ro.observe(canvas)

  const tick = (ms: number) => {
    if (!start) start = ms
    const raw = Math.min(1, (ms - start) / SEEP_DURATION_MS)
    const eased = 1 - (1 - raw) ** 3
    drawFrame(eased)
    if (raw < 1) {
      raf = requestAnimationFrame(tick)
    } else {
      settled = true
      raf = 0
    }
  }

  if (settled) {
    drawFrame(1)
  } else {
    raf = requestAnimationFrame(tick)
  }

  return () => {
    if (raf) cancelAnimationFrame(raf)
    ro.disconnect()
    themeObserver.disconnect()
    gl.deleteBuffer(buffer)
    gl.deleteProgram(program)
    gl.deleteShader(vs)
    gl.deleteShader(fs)
  }
}

export const PageBleed: FC<{ hue: number; seed?: number }> = ({
  hue,
  seed = 0.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const attachCanvas = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el
    setMounted(el !== null)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!mounted || !canvas) return
    return mountBokashi(canvas, hue, seed)
  }, [mounted, hue, seed])

  return (
    <RootPortal>
      <div aria-hidden className="page-bleed">
        <canvas className="size-full" ref={attachCanvas} />
      </div>
    </RootPortal>
  )
}
