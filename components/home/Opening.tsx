'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useReduced } from '../motion/hooks'

/**
 * The opening: a fly-through of a plaza of our instruments, ray-marched live on the GPU and printed
 * the way everything else on the site is printed: a pink drum for the light, a blue halftone drum for
 * the shadow, slightly out of register, with ink rain falling through it. Scroll drives the camera.
 * At the end the pink ink floods the frame, which is the paper the hands are printed on next.
 * No loader: the shader compiles in a frame and the page is usable from the first paint.
 */

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes;
uniform float uT, uP, uFlood, uDot;
uniform vec2 uMouse;

const vec3 PINK = vec3(1.0, 0.56, 0.82);
const vec3 BLUE = vec3(0.17, 0.33, 0.86);

mat2 r2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdCyl(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdTorus(vec3 p, float R, float r){ return length(vec2(length(p.xz) - R, p.y)) - r; }

// The plaza: an obelisk with an armillary at its top, a colonnade around it, a domed hall beyond.
vec2 map(vec3 p){
  float d = p.y; float m = 0.;
  // obelisk, tapering
  vec3 q = p; float k = 1. - q.y * 0.045;
  float ob = sdBox(vec3(q.x / k, q.y - 5., q.z / k), vec3(0.55, 5., 0.55)) * k;
  ob = min(ob, sdBox(p - vec3(0, 0.45, 0), vec3(1.3, 0.45, 1.3)));
  if (ob < d) { d = ob; m = 1.; }
  // armillary rings turning slowly above it
  vec3 a = p - vec3(0, 11.8, 0);
  float ar = length(a) - 0.55;
  vec3 a1 = a; a1.xy *= r2(1.2); ar = min(ar, sdTorus(a1, 1.7, 0.07));
  vec3 a2 = a; a2.yz *= r2(1.57 + uT * 0.15); ar = min(ar, sdTorus(a2, 1.55, 0.06));
  vec3 a3 = a; a3.xz *= r2(uT * 0.2); a3.xy *= r2(0.4); ar = min(ar, sdTorus(a3, 1.4, 0.05));
  if (ar < d) { d = ar; m = 2.; }
  // colonnade: a ring of columns with an entablature, by polar repetition
  float ang = atan(p.z, p.x); float n = 36.; float sec = 6.2831853 / n;
  float aa = mod(ang + sec * 0.5, sec) - sec * 0.5;
  vec3 c = vec3(length(p.xz) * cos(aa), p.y, length(p.xz) * sin(aa));
  float col = sdCyl(c - vec3(15., 2.2, 0), 0.32, 2.2);
  float ring = max(abs(length(p.xz) - 15.) - 0.75, abs(p.y - 4.65) - 0.28);
  float cl = min(col, ring);
  if (cl < d) { d = cl; m = 3.; }
  // the hall and its dome, far behind
  vec3 h = p - vec3(0, 0, -34);
  float hall = sdBox(h - vec3(0, 4., 0), vec3(14., 4., 6.));
  hall = min(hall, sdCyl(h - vec3(0, 9., 0), 5.6, 1.2));
  hall = min(hall, max(length(h - vec3(0, 10., 0)) - 5.6, -(h.y - 10.)));
  hall = min(hall, sdBox(h - vec3(0, 16.6, 0), vec3(0.35, 1.2, 0.35)));
  if (hall < d) { d = hall; m = 4.; }
  return vec2(d, m);
}

vec3 normal(vec3 p){ vec2 e = vec2(0.01, 0); return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }

// camera path over the scroll
void cam(float t, out vec3 ro, out vec3 ta){
  float a = mix(-0.35, 2.4, smoothstep(0., 1., t));
  float r = mix(40., 7.5, smoothstep(0., 0.75, t)) + 3. * sin(t * 3.1);
  float y = mix(14., 9.5, smoothstep(0., 0.4, t)) + mix(0., 2.5, smoothstep(0.55, 1., t));
  ro = vec3(sin(a) * r, y, cos(a) * r);
  ta = mix(vec3(0, 4., -6.), vec3(0, 11.5, 0), smoothstep(0.2, 0.85, t));
}

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  vec3 ro, ta; cam(uP, ro, ta);
  ro.xy += uMouse * vec2(0.8, 0.4);
  vec3 f = normalize(ta - ro), r = normalize(cross(f, vec3(0, 1, 0))), u = cross(r, f);
  vec3 rd = normalize(f * 1.35 + uv.x * r + uv.y * u);

  float t = 0.; vec2 h = vec2(0.);
  for (int i = 0; i < 90; i++) { h = map(ro + rd * t); if (h.x < 0.002 * t || t > 120.) break; t += h.x * 0.9; }
  float light = 0.;
  if (t < 120.) {
    vec3 pos = ro + rd * t; vec3 nr = normal(pos);
    vec3 L = normalize(vec3(-0.5, 0.8, 0.45));
    float dif = clamp(dot(nr, L), 0., 1.);
    float sh = 1.; float st = 0.05;
    for (int i = 0; i < 24; i++) { float d = map(pos + nr * 0.02 + L * st).x; sh = min(sh, 8. * d / st); st += clamp(d, 0.05, 1.5); if (sh < 0.01 || st > 30.) break; }
    float ao = clamp(map(pos + nr * 0.4).x / 0.4, 0., 1.);
    light = (0.15 + 0.85 * dif * clamp(sh, 0., 1.)) * (0.55 + 0.45 * ao);
    light = mix(light, 0.92, smoothstep(30., 110., t));       // the air: far things fade to paper
  } else {
    light = 0.82 + 0.18 * uv.y;                               // sky
  }

  // ink rain: long thin strokes, falling and slightly slanted, in the shadow ink
  vec2 rp = vec2(uv.x * 46. + uv.y * 4., uv.y * 2. + uT * 1.7);
  float lane = floor(rp.x);
  float len = 0.22 + 0.5 * hash(vec2(lane, 3.));
  float y0 = fract(rp.y * 0.18 + hash(vec2(lane, 9.)));
  float rain = step(0.86, hash(vec2(lane, 1.))) * smoothstep(len, 0., y0) * smoothstep(0.08, 0.0, abs(fract(rp.x) - 0.5) - 0.02);

  // two drums: pink is flat ink everywhere; blue is a 45 degree halftone whose dots grow with the shadow
  float dark = clamp(1.0 - light, 0., 1.);
  vec2 g = r2(0.785) * (frag + vec2(2.0, -1.5)) / uDot;      // offset: the blue drum is out of register
  float dd = length(fract(g) - 0.5);
  float rad = sqrt(dark) * 0.72;
  float blue = smoothstep(rad + 0.06, rad - 0.06, dd);
  blue = max(blue, rain * 0.85);
  // paper speckle where the drum ran dry
  float speck = step(0.93, hash(floor(frag / 1.5) + floor(uT * 2.)));
  blue *= 1. - speck * 0.6;

  vec3 col = PINK;
  col = mix(col, col * BLUE, blue);
  // the flood: pink ink rises over everything and the frame becomes paper for what comes next
  col = mix(col, vec3(1.0, 0.72, 0.88), uFlood);
  o = vec4(col, 1.);
}`

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
  return s
}

function useShader(canvas: React.RefObject<HTMLCanvasElement | null>, progress: () => number, active: boolean, onFail: () => void) {
  useEffect(() => {
    const c = canvas.current
    if (!c || !active) return
    const gl = c.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    if (!gl) return onFail()
    let prog: WebGLProgram
    try {
      prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link')
    } catch (e) {
      console.warn('[opening]', e)
      return onFail()
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const U = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = U('uRes'), uT = U('uT'), uP = U('uP'), uFlood = U('uFlood'), uDot = U('uDot'), uMouse = U('uMouse')

    // ponytail: fixed render scale per device class; add adaptive resolution if slow GPUs complain
    const small = window.matchMedia('(max-width: 899px)').matches
    const scale = small ? 0.5 : 0.62
    const resize = () => {
      const w = Math.round(c.clientWidth * scale), h = Math.round(c.clientHeight * scale)
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
        gl.viewport(0, 0, w, h)
      }
    }
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / innerWidth - 0.5) * 2
      mouse.ty = -(e.clientY / innerHeight - 0.5) * 2
    }
    addEventListener('pointermove', onMove)
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(c)
    let raf = 0
    const t0 = performance.now()
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || (small && now - last < 32)) return
      last = now
      resize()
      mouse.x += (mouse.tx - mouse.x) * 0.05
      mouse.y += (mouse.ty - mouse.y) * 0.05
      const pr = progress()
      gl.uniform2f(uRes, c.width, c.height)
      gl.uniform1f(uT, (now - t0) / 1000)
      gl.uniform1f(uP, Math.min(pr / 0.6, 1))
      gl.uniform1f(uFlood, Math.max(0, Math.min(1, (pr - 0.57) / 0.1)))
      gl.uniform1f(uDot, small ? 3.2 : 4.2)
      gl.uniform2f(uMouse, mouse.x, mouse.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('pointermove', onMove)
      io.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [canvas, progress, active, onFail])
}

const WORD = 'KOGNIVO'

export function Opening() {
  const ref = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduce = useReduced()
  const [failed, setFailed] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })
  const pRef = useRef(0)
  useMotionValueEvent(smooth, 'change', (v) => (pRef.current = v))
  const progress = useRef(() => pRef.current).current
  const fail = useRef(() => setFailed(true)).current
  useShader(canvas, progress, !reduce && !failed, fail)

  // the floating word: letters fly toward and past the camera, spreading as they come
  const z = useTransform(smooth, [0, 0.56], [-900, 700])
  const spread = useTransform(smooth, [0, 0.56], [0, 1])
  const wordOpacity = useTransform(smooth, [0, 0.06, 0.42, 0.54], [0.0, 0.9, 0.9, 0])
  const introOpacity = useTransform(smooth, [0, 0.1], [1, 0])
  const introY = useTransform(smooth, [0, 0.1], [0, -40])
  const outroOpacity = useTransform(smooth, [0.44, 0.52, 0.62, 0.7], [0, 1, 1, 0])

  // the scroll badge follows the pointer, a little late
  const badge = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (reduce) return
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0
    const move = (e: PointerEvent) => ((tx = e.clientX), (ty = e.clientY))
    const tick = () => {
      x += (tx - x) * 0.12
      y += (ty - y) * 0.12
      if (badge.current) badge.current.style.transform = `translate(${x - 56}px, ${y - 56}px)`
      raf = requestAnimationFrame(tick)
    }
    addEventListener('pointermove', move)
    raf = requestAnimationFrame(tick)
    return () => (removeEventListener('pointermove', move), cancelAnimationFrame(raf))
  }, [reduce])

  return (
    <section ref={ref} className="opening" aria-label="Kognivo">
      <div className="opening-stage">
        {reduce || failed ? (
          <img className="opening-still" src="/prints/armillary-wide.webp" alt="" width={1600} height={900} />
        ) : (
          <canvas ref={canvas} className="opening-canvas" aria-hidden />
        )}
        {!reduce && (
          <div className="opening-word" aria-hidden>
            {[...WORD].map((ch, i) => (
              <Letter key={i} ch={ch} i={i} n={WORD.length} z={z} spread={spread} opacity={wordOpacity} />
            ))}
          </div>
        )}
        <motion.div className="opening-intro" style={reduce ? undefined : { opacity: introOpacity, y: introY }}>
          <h1>Things we make.</h1>
          <p>Software, hardware and projects, printed in Raipur. Scroll to walk in.</p>
          <a href="#floor" className="btn">Skip to the shop</a>
        </motion.div>
        <motion.p className="opening-outro" style={reduce ? undefined : { opacity: outroOpacity }}>
          Everything here was made by hand,
        </motion.p>
        {!reduce && (
          <div ref={badge} className="scroll-badge" aria-hidden>
            <span>Scroll<br />down</span>
          </div>
        )}
      </div>
    </section>
  )
}

function Letter({ ch, i, n, z, spread, opacity }: { ch: string; i: number; n: number; z: ReturnType<typeof useTransform<number, number>>; spread: ReturnType<typeof useTransform<number, number>>; opacity: ReturnType<typeof useTransform<number, number>> }) {
  const off = i - (n - 1) / 2
  const x = useTransform(spread, (s) => `${off * (1 + s * 1.6) * 13}vw`)
  const zz = useTransform(z, (v) => v + Math.abs(off) * 60)
  const ry = useTransform(spread, (s) => off * s * 9)
  return (
    <motion.span className="opening-letter" style={{ x, z: zz, rotateY: ry, opacity }}>
      {ch}
    </motion.span>
  )
}
