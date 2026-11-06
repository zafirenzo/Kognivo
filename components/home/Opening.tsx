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
uniform float uT, uFlood, uDot, uRoll, uSpin;
uniform vec3 uRo, uTa;

const vec3 PINK = vec3(1.0, 0.56, 0.82);
const vec3 BLUE = vec3(0.17, 0.33, 0.86);

mat2 r2(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
float sdCyl(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdTorus(vec3 p, float R, float r){ return length(vec2(length(p.xz) - R, p.y)) - r; }
float sdCap(vec3 p, float h, float r){ p.y -= clamp(p.y, 0., h); return length(p) - r; }

// The plaza, after a famous square: an obelisk carrying our armillary, two fountains, a colonnade of
// two rows of columns with figures along its roof, open at the front and toward the hall, straight
// wings running back to a hall with a columned front, a drum, a dome, a lantern and two small domes.
vec2 map(vec3 p){
  float d = p.y; float m = 5.;
  // obelisk, tapering, on a stepped base
  float k = 1. - p.y * 0.045;
  float ob = sdBox(vec3(p.x / k, p.y - 5., p.z / k), vec3(0.55, 5., 0.55)) * k;
  ob = min(ob, sdBox(p - vec3(0, 0.45, 0), vec3(1.3, 0.45, 1.3)));
  ob = min(ob, sdBox(p - vec3(0, 0.15, 0), vec3(2.2, 0.15, 2.2)));
  if (ob < d) { d = ob; m = 1.; }
  // the armillary, turning above it
  vec3 a = p - vec3(0, 11.8, 0);
  float ar = length(a) - 0.55;
  vec3 a1 = a; a1.xy *= r2(1.2 + uSpin * 0.3); ar = min(ar, sdTorus(a1, 1.7, 0.07));
  vec3 a2 = a; a2.yz *= r2(1.57 + uT * 0.15 + uSpin); ar = min(ar, sdTorus(a2, 1.55, 0.06));
  vec3 a3 = a; a3.xz *= r2(uT * 0.2 + uSpin * 0.6); a3.xy *= r2(0.4); ar = min(ar, sdTorus(a3, 1.4, 0.05));
  vec3 a4 = a; a4.yz *= r2(0.5); a4.xy *= r2(-uSpin * 0.8); ar = min(ar, sdTorus(a4, 1.85, 0.035));
  if (ar < d) { d = ar; m = 2.; }
  // two fountains
  vec3 f = vec3(abs(p.x) - 8.5, p.y, p.z);
  float fo = sdCyl(f - vec3(0, 0.3, 0), 1.7, 0.3);
  fo = min(fo, sdCyl(f - vec3(0, 1.2, 0), 0.22, 1.2));
  fo = min(fo, max(sdCyl(f - vec3(0, 2.3, 0), 0.9, 0.18), -sdCyl(f - vec3(0, 2.45, 0), 0.75, 0.2)));
  if (fo < d) { d = fo; m = 3.; }
  // colonnade: two rows of columns and a roof with figures, by polar repetition, cut open front and back
  float rr = length(p.xz);
  if (rr > 12. && rr < 18. && p.y < 8.) {
    float ang = atan(p.z, p.x); float n = 40.; float sec = 6.2831853 / n;
    float aa = mod(ang + sec * 0.5, sec) - sec * 0.5;
    vec3 c = vec3(rr * cos(aa), p.y, rr * sin(aa));
    float col = min(sdCyl(c - vec3(14.3, 2.2, 0), 0.3, 2.2), sdCyl(c - vec3(15.9, 2.2, 0), 0.3, 2.2));
    float roof = max(abs(rr - 15.1) - 1.25, abs(p.y - 4.75) - 0.32);
    float fig = sdCap(c - vec3(15.1, 5.1, 0), 0.8, 0.22);
    float cl = min(min(col, roof), fig);
    float front = (0.32 - abs(ang - 1.5708)) * rr;
    float back = (0.62 - abs(ang + 1.5708)) * rr;
    cl = max(cl, max(front, back));
    if (cl < d) { d = cl; m = 3.; }
  } else d = min(d, max(abs(rr - 15.) - 2.6, 0.) + max(p.y - 8., 0.) + 0.5);
  // straight wings back to the hall
  vec3 w = vec3(abs(p.x) - 9.6, p.y, p.z + 21.);
  if (w.z > -8. && w.z < 8.) {
    vec3 wz = w; wz.z = mod(wz.z + 0.8, 1.6) - 0.8;
    float wc = min(sdCyl(vec3(wz.x - 0.7, wz.y - 2.2, wz.z), 0.28, 2.2), sdCyl(vec3(wz.x + 0.7, wz.y - 2.2, wz.z), 0.28, 2.2));
    wc = min(wc, sdBox(w - vec3(0, 4.75, 0), vec3(1.3, 0.32, 7.)));
    wc = max(wc, abs(w.z) - 7.);
    if (wc < d) { d = wc; m = 3.; }
  }
  // the hall: a front of columns, the block behind, a drum, the dome, a lantern, two small domes
  vec3 h = p - vec3(0, 0, -34);
  float hall = sdBox(h - vec3(0, 4.2, -1.), vec3(14., 4.2, 6.));
  vec3 hc = h - vec3(0, 3.6, 5.3); hc.x = mod(hc.x + 1., 2.) - 1.;
  hall = min(hall, max(sdCyl(hc, 0.36, 3.6), abs(h.x) - 11.));
  hall = min(hall, sdBox(h - vec3(0, 7.9, 5.3), vec3(11.5, 0.5, 0.6)));
  hall = min(hall, sdBox(h - vec3(0, 9.1, 3.), vec3(4.5, 0.9, 1.8)));
  vec3 dm = h - vec3(0, 0, -2.);
  hall = min(hall, sdCyl(dm - vec3(0, 10.2, 0), 5.4, 1.6));
  hall = min(hall, max(length(dm - vec3(0, 11.8, 0)) - 5.6, -(dm.y - 11.8)));
  hall = min(hall, sdCyl(dm - vec3(0, 18.1, 0), 0.8, 0.8));
  hall = min(hall, sdBox(dm - vec3(0, 19.6, 0), vec3(0.12, 0.8, 0.12)));
  vec3 sd = vec3(abs(h.x) - 10.5, h.y, h.z + 1.);
  hall = min(hall, max(length(sd - vec3(0, 8.4, 0)) - 2.2, -(sd.y - 8.4)));
  if (hall < d) { d = hall; m = 4.; }
  return vec2(d, m);
}

vec3 normal(vec3 p){ vec2 e = vec2(0.01, 0); return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }

float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  vec3 ro = uRo, ta = uTa;
  vec3 f = normalize(ta - ro), r = normalize(cross(f, vec3(0, 1, 0))), u = cross(r, f);
  // bank: the camera rolls into its turns
  vec3 r1 = r * cos(uRoll) + u * sin(uRoll); vec3 u1 = cross(r1, f);
  vec3 rd = normalize(f * 1.2 + uv.x * r1 + uv.y * u1);

  float t = 0.; vec2 h = vec2(0.);
  for (int i = 0; i < 110; i++) { h = map(ro + rd * t); if (h.x < 0.0015 * t || t > 140.) break; t += h.x * 0.85; }
  float light = 0.;
  if (t < 140.) {
    vec3 pos = ro + rd * t; vec3 nr = normal(pos);
    vec3 L = normalize(vec3(-0.5, 0.8, 0.45));
    float dif = clamp(dot(nr, L), 0., 1.);
    float sh = 1.; float st = 0.05;
    for (int i = 0; i < 22; i++) { float dd = map(pos + nr * 0.02 + L * st).x; sh = min(sh, 8. * dd / st); st += clamp(dd, 0.06, 1.6); if (sh < 0.01 || st > 30.) break; }
    float ao = clamp(map(pos + nr * 0.4).x / 0.4, 0., 1.);
    light = (0.32 + 0.68 * dif * clamp(sh, 0., 1.)) * (0.68 + 0.32 * ao);
    if (h.y == 5.) {
      // the paving: rays from the obelisk and rings, laid in the shadow ink
      float rr = length(pos.xz), an = atan(pos.z, pos.x);
      float w = 0.02 + t * 0.0012;
      float spokes = smoothstep(w * 2., 0., (0.5 - abs(fract(an / 6.2831853 * 16.) - 0.5)) * 0.3927 * rr) * step(2.4, rr) * step(rr, 14.);
      float rings = smoothstep(w * 2., 0., (0.5 - abs(fract(rr / 4.6) - 0.5)) * 4.6);
      light *= 1. - 0.28 * max(spokes, rings * step(rr, 14.));
    }
    light = mix(light, 0.92, smoothstep(34., 130., t));      // the air: far things fade to paper
  } else {
    light = 0.84 + 0.16 * dot(rd, vec3(0, 1, 0));            // sky
  }
  light += 0.1 * (1. - smoothstep(0.1, 0.9, length(uv)));    // a glow toward the middle, like the reference's light

  // ink rain: long thin strokes, falling and slanted, banking with the camera
  vec2 ru = r2(-uRoll) * uv;
  vec2 rp = vec2(ru.x * 46. + ru.y * 4., ru.y * 2. + uT * 1.7);
  float lane = floor(rp.x);
  float len = 0.22 + 0.5 * hash(vec2(lane, 3.));
  float y0 = fract(rp.y * 0.18 + hash(vec2(lane, 9.)));
  float rain = step(0.86, hash(vec2(lane, 1.))) * smoothstep(len, 0., y0) * smoothstep(0.08, 0.0, abs(fract(rp.x) - 0.5) - 0.02);

  // two drums: pink is flat ink everywhere; blue is a 45 degree halftone whose dots grow with the shadow
  float dark = pow(clamp(1.0 - light, 0., 1.), 1.35); // keep the pink for the light, the blue for real shadow
  vec2 g = r2(0.785) * (frag + vec2(2.0, -1.5)) / uDot;
  float dd = length(fract(g) - 0.5);
  float rad = sqrt(dark) * 0.72;
  float blue = smoothstep(rad + 0.06, rad - 0.06, dd);
  blue = max(blue, rain * 0.85);
  float speck = step(0.93, hash(floor(frag / 1.5) + floor(uT * 2.)));
  blue *= 1. - speck * 0.6;

  vec3 col = PINK;
  col = mix(col, col * BLUE, blue);
  col = mix(col, vec3(1.0, 0.72, 0.88), uFlood);
  o = vec4(col, 1.);
}`

// The flight, as keyframes: where the camera is, what it looks at, how far it banks (degrees).
// Catmull-Rom through them, so the swoops are smooth. After the last one it circles the armillary.
const KEYS: [number, [number, number, number], [number, number, number], number][] = [
  [0.0, [0, 16, 46], [0, 6, -10], 0],
  [0.1, [5, 13, 32], [0, 7, 0], -5],
  [0.22, [17, 8.4, 14], [2, 4, -4], -24],
  [0.34, [12.5, 6.2, 2.5], [-2, 7.5, -2], -32],
  [0.44, [3.4, 5.4, 4.2], [-1, 9, -3], 20],
  [0.54, [-5.5, 3.0, -6], [0, 7, -30], 9],
  [0.64, [-8.5, 7, -21], [0, 12, -36], -16],
  [0.74, [-3.5, 17.5, -27], [0, 10, -36], 22],
  [0.86, [5, 16, -9], [0, 11.8, 0], 5],
  [1.0, [0, 12.5, 4.4], [0, 11.8, 0], 0],
]

type V3 = [number, number, number]
const cr = (a: number, b: number, c: number, d: number, t: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
function flight(t: number) {
  t = Math.min(Math.max(t, 0), 1)
  let i = 0
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++
  const k0 = KEYS[Math.max(i - 1, 0)], k1 = KEYS[i], k2 = KEYS[i + 1], k3 = KEYS[Math.min(i + 2, KEYS.length - 1)]
  const u = (t - k1[0]) / (k2[0] - k1[0])
  const v = (j: 1 | 2) => [0, 1, 2].map((n) => cr(k0[j][n], k1[j][n], k2[j][n], k3[j][n], u)) as V3
  return { ro: v(1), ta: v(2), roll: (cr(k0[3], k1[3], k2[3], k3[3], u) * Math.PI) / 180 }
}

// Where the scroll is in the story: the flight, the armillary chapter, the flood.
const FLIGHT_END = 0.6, CHAPTER_END = 0.83, FLOOD_END = 0.885

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
    const uRes = U('uRes'), uT = U('uT'), uFlood = U('uFlood'), uDot = U('uDot'), uRo = U('uRo'), uTa = U('uTa'), uRoll = U('uRoll'), uSpin = U('uSpin')

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
      const fl = flight(pr / FLIGHT_END)
      let { ro, ta } = fl
      // the chapter: circle the armillary slowly, close enough that it fills the frame
      const ch = Math.min(Math.max((pr - FLIGHT_END) / (CHAPTER_END - FLIGHT_END), 0), 1)
      if (ch > 0) {
        const a = ch * 1.9
        ro = [Math.sin(a) * (4.4 - ch * 0.6), 12.5 + Math.sin(ch * 3.1) * 0.7, Math.cos(a) * (4.4 - ch * 0.6)]
        ta = [0, 11.8, 0]
      }
      gl.uniform3f(uRo, ro[0] + mouse.x * 0.6, ro[1] + mouse.y * 0.3, ro[2])
      gl.uniform3f(uTa, ta[0], ta[1], ta[2])
      gl.uniform1f(uRoll, fl.roll * (1 - ch))
      gl.uniform1f(uSpin, ch * 4)
      gl.uniform1f(uFlood, Math.max(0, Math.min(1, (pr - CHAPTER_END) / (FLOOD_END - CHAPTER_END - 0.01))))
      gl.uniform1f(uDot, small ? 3.2 : 4.2)
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
const NUMERALS = 'MMXXVI'

export function Opening() {
  const ref = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const reduce = useReduced()
  const [failed, setFailed] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24, mass: 0.45 })
  const pRef = useRef(0)
  useMotionValueEvent(smooth, 'change', (v) => (pRef.current = v))
  const progress = useRef(() => pRef.current).current
  const fail = useRef(() => setFailed(true)).current
  useShader(canvas, progress, !reduce && !failed, fail)

  // the name crosses the frame one giant letter at a time while the camera flies
  const wordX = useTransform(smooth, [0.05, 0.56], ['100vw', '-100%'])
  const wordOpacity = useTransform(smooth, [0.05, 0.08, 0.52, 0.56], [0, 1, 1, 0])
  // the chapter: the year's numerals cross behind two notes on paper
  const numX = useTransform(smooth, [0.58, 0.84], ['100vw', '-100%'])
  const numOpacity = useTransform(smooth, [0.58, 0.61, 0.8, 0.84], [0, 1, 1, 0])
  const noteA = useTransform(smooth, [0.62, 0.65, 0.71, 0.73], [0, 1, 1, 0])
  const noteAY = useTransform(smooth, [0.62, 0.73], [40, -40])
  const noteB = useTransform(smooth, [0.72, 0.75, 0.81, 0.83], [0, 1, 1, 0])
  const noteBY = useTransform(smooth, [0.72, 0.83], [40, -40])
  const introOpacity = useTransform(smooth, [0, 0.04], [1, 0])
  const introY = useTransform(smooth, [0, 0.04], [0, -40])
  const outroOpacity = useTransform(smooth, [0.835, 0.85, 0.875, 0.89], [0, 1, 1, 0])
  const badgeOpacity = useTransform(smooth, [0.8, 0.84], [1, 0])

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
          <>
            <motion.p className="opening-word" style={{ x: wordX, opacity: wordOpacity }} aria-hidden>
              {[...WORD].map((ch, i) => (
                <span key={i}>{ch}</span>
              ))}
            </motion.p>
            <motion.p className="opening-word opening-numerals" style={{ x: numX, opacity: numOpacity }} aria-hidden>
              {NUMERALS}
            </motion.p>
            <motion.div className="opening-note opening-note-a" style={{ opacity: noteA, y: noteAY }}>
              <p className="opening-note-kicker">Catalogue MMXXVI</p>
              <h2>Software, hardware, and the odd strange project.</h2>
              <p>Kognivo is a small studio in Raipur. Everything in this shop is ours: apps by the month or for keeps, tools that cost nothing, boards you can hold, and projects that fit nowhere else.</p>
            </motion.div>
            <motion.div className="opening-note opening-note-b" style={{ opacity: noteB, y: noteBY }}>
              <p className="opening-note-kicker">How it works</p>
              <h2>One shop, one cart.</h2>
              <p>Put software and hardware in the same cart, ship in India or abroad, or ask us to build something only you need.</p>
            </motion.div>
          </>
        )}
        <motion.div className="opening-intro" style={reduce ? undefined : { opacity: introOpacity, y: introY }}>
          <h1>Things we make.</h1>
          <p>Software, hardware and projects, printed in Raipur. Scroll to fly in.</p>
          <a href="/atlas" className="btn">Skip to the Atlas</a>
        </motion.div>
        <motion.p className="opening-outro" style={reduce ? undefined : { opacity: outroOpacity }}>
          <span>Everything here was made by hand,</span>
        </motion.p>
        {!reduce && (
          <motion.div ref={badge} className="scroll-badge" style={{ opacity: badgeOpacity }} aria-hidden>
            <span>Scroll<br />down</span>
          </motion.div>
        )}
      </div>
    </section>
  )
}
