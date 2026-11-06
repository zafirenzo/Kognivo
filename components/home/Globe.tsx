'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Link from 'next/link'
import type { MotionValue } from 'motion/react'
import { PRODUCTS, SHELVES, plateNo, prints, priceLabel, shelfOf, widePrint } from '@/lib/catalogue'
import { TINT, tintOf } from '../Chrome'
import { SlotMachine } from './SlotMachine'
import { useReduced } from '../motion/hooks'

/**
 * The shop on a globe. Every product is a cluster of its prints laid out on a flat page, and the page is
 * wrapped onto a huge ball seen head on, by arc length from the centre: rows stay straight and evenly spaced
 * on the surface, the edges roll away and fade at the rim, the flanks darken in blue halftone. A ruled lattice
 * (tipped 23.4 degrees, like the Earth) is the same mapping drawn as lines. Drag to spin it; it keeps turning
 * with what you gave it. `grow` (0..1) runs the arrival: nothing, a small spinning ball, the ball swelling to
 * fill the frame, then the clusters landing from the centre outward. Click a cluster to pull the machine.
 */

const COLS = 4
const ROWS = Math.ceil(PRODUCTS.length / COLS)
const SEG = 18

type Tile = { src: string; x: number; y: number; w: number; h: number } // in the cluster's own px
type Cluster = { i: number; tiles: Tile[]; w: number; h: number; gx: number; gy: number; o: { x: number; y: number }; a: number }

// One cluster per product: the cover and the poster on top, the turned prints underneath.
function cluster(i: number, W: number, gap: number): Cluster {
  const x = PRODUCTS[i]
  const [poster, ...rest] = prints(x)
  const h1 = (W - gap) / (16 / 9 + 4 / 5)
  const top: Tile[] = [
    { src: widePrint(x), x: 0, y: 0, w: h1 * (16 / 9), h: h1 },
    { src: poster, x: h1 * (16 / 9) + gap, y: 0, w: h1 * 0.8, h: h1 },
  ]
  const n = 3
  const w2 = (W - gap * (n - 1)) / n
  const off = i % 2 ? n - rest.length : 0 // alternate which side a short row hangs from
  const bottom = rest.map((src, k) => ({ src, x: (k + off) * (w2 + gap), y: h1 + gap, w: w2, h: w2 * 1.25 }))
  return { i, tiles: [...top, ...bottom], w: W, h: h1 + gap + w2 * 1.25, gx: 0, gy: 0, o: { x: 0, y: 0 }, a: 0 }
}

const VERT = /* glsl */ `
uniform vec2 uC; uniform float uR; uniform vec4 uRect; uniform float uLift; uniform vec2 uLiftAt;
varying vec2 vUv; varying float vFace;
void main(){
  vUv = uv;
  vec2 px = uRect.xy + vec2(uv.x, 1.0 - uv.y) * uRect.zw;
  px = uLiftAt + (px - uLiftAt) * (1.0 + 0.06 * uLift);
  float u = (px.x - uC.x) / uR, v = (px.y - uC.y) / uR;
  float cv = cos(v);
  vec2 s = vec2(uC.x + uR * cv * sin(u), uC.y + uR * sin(v));
  vFace = cv * cos(u) * step(abs(u), 1.6) * step(abs(v), 1.5);
  gl_Position = projectionMatrix * vec4(s, -uLift, 1.0);
}`
const FRAG = /* glsl */ `
uniform sampler2D uMap; uniform float uAlpha; uniform vec2 uSize;
varying vec2 vUv; varying float vFace;
void main(){
  // rounded corners, 5px in the tile's own space
  vec2 p = (vUv - 0.5) * uSize; vec2 q = abs(p) - uSize * 0.5 + 5.0;
  float corner = 1.0 - smoothstep(-0.5, 0.5, length(max(q, 0.0)) - 5.0);
  vec4 c = texture2D(uMap, vUv);
  float fade = smoothstep(0.18, 0.5, vFace);
  c.rgb *= mix(0.78, 1.0, smoothstep(0.2, 0.9, vFace));
  gl_FragColor = vec4(c.rgb, c.a * corner * fade * uAlpha);
}`

// The ball itself: paper inside the limb, blue halftone on the flanks, the lattice, the limb's ring.
const BALL_FRAG = /* glsl */ `
uniform vec2 uC; uniform float uR; uniform float uSpin; uniform float uShiftY; uniform float uTilt; uniform float uDpr; uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uBlue; uniform float uLattice; uniform vec2 uRes;
const float STEP = 0.5235988;
float lines(float x, float fw, float w){ float d = abs(fract(x - 0.5) - 0.5); return clamp(w - d / max(fw, 1e-5) + 0.5, 0.0, 1.0) * (1.0 - smoothstep(0.35, 0.9, fw)); }
void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 d = (px - uC) / uR; float r2 = dot(d, d);
  float edge = fwidth(sqrt(r2));
  float inside = 1.0 - smoothstep(1.0 - edge, 1.0, sqrt(r2));
  float ring = 1.0 - smoothstep(0.0, edge * 1.6, abs(sqrt(r2) - 1.0) - edge * 0.6);
  float z = sqrt(max(1.0 - r2, 0.0));
  vec3 n = vec3(d.x, -d.y, z);
  // the lattice: meridians and parallels every 30 degrees, on an axis tipped toward the eye
  vec3 l = vec3(n.x, cos(uTilt) * n.y + sin(uTilt) * n.z, -sin(uTilt) * n.y + cos(uTilt) * n.z);
  float lon = atan(l.x, l.z) + uSpin; float la0 = asin(clamp(l.y, -1.0, 1.0)); float la = la0 + uShiftY;
  float fwl = (fwidth(l.x) + fwidth(l.z)) / max(length(l.xz), 1e-3) / STEP;
  float fwp = fwidth(la) / STEP;
  float pole = 1.0 - smoothstep(0.8, 0.96, abs(l.y));
  float lat = max(lines(lon / STEP, fwl, 0.6) * pole, lines(la / STEP, fwp, 0.6) * (1.0 - step(2.5, abs(la0 / STEP))));
  // the flanks, in blue halftone: dots grow as the surface turns away
  float tone = smoothstep(0.88, 0.1, z) * 0.6;
  vec2 g = mat2(0.966, -0.259, 0.259, 0.966) * px / 7.0;
  float ht = 1.0 - smoothstep(-0.08, 0.08, length(fract(g) - 0.5) - sqrt(tone) * 0.62);
  vec3 col = mix(uPaper, uBlue, ht * 0.8);
  col = mix(col, uInk, lat * 0.22 * uLattice);
  col = mix(col, uInk, ring);
  float a = max(inside, ring);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(col, a);
}`

const fmt = (deg: number) => `${deg < 0 ? 'W' : 'E'} ${Math.abs(deg).toFixed(1).padStart(5, '0')}°`
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)
const wrap = (v: number, period: number) => ((((v + period / 2) % period) + period) % period) - period / 2

export function Globe({ grow }: { grow?: MotionValue<number> }) {
  const host = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const coords = useRef<HTMLSpanElement>(null)
  const chrome = useRef<HTMLDivElement>(null)
  const api = useRef<{ goTo: (shelf: string | null) => void } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [shelf, setShelf] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const reduce = useReduced()

  useEffect(() => {
    const el = host.current, canvas = canvasRef.current
    if (!el || !canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: false })
    } catch {
      setFailed(true)
      return
    }
    const dpr = Math.min(devicePixelRatio, 1.75)
    renderer.setPixelRatio(dpr)
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -100, 100)

    const C = new THREE.Vector2()
    const ballMat = new THREE.ShaderMaterial({
      uniforms: {
        uC: { value: C }, uR: { value: 1 }, uSpin: { value: 0 }, uShiftY: { value: 0 }, uTilt: { value: 0.41 }, uDpr: { value: dpr }, uLattice: { value: 1 }, uRes: { value: new THREE.Vector2() },
        uPaper: { value: new THREE.Color('#f7f3ea') }, uInk: { value: new THREE.Color('#16163a') }, uBlue: { value: new THREE.Color('#0078bf') },
      },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: BALL_FRAG,
      transparent: true,
      depthTest: false,
      extensions: { derivatives: true } as never,
    })
    const ball = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ballMat)
    ball.frustumCulled = false
    ball.renderOrder = -1
    scene.add(ball)

    const loader = new THREE.TextureLoader()
    const aniso = renderer.capabilities.getMaxAnisotropy()
    const textures: THREE.Texture[] = []
    const geo = new THREE.PlaneGeometry(1, 1, SEG, SEG)
    let clusters: Cluster[] = []
    let P = { x: 1, y: 1 }
    const meshes: { m: THREE.Mesh; c: number; t: Tile }[] = []
    const lift = PRODUCTS.map(() => 0)
    const dim = PRODUCTS.map(() => 0)

    let w = 0, h = 0, R = 1, Rfull = 1, Rball = 1
    const layout = () => {
      const phone = w < 700
      const W = phone ? 230 : 390
      const gap = phone ? 5 : 8
      const gx = phone ? 90 : 190
      const gy = phone ? 70 : 110
      clusters = PRODUCTS.map((_, i) => cluster(i, W, gap))
      const rowH = Math.max(...clusters.map((c) => c.h))
      clusters.forEach((c, i) => {
        const col = i % COLS, row = Math.floor(i / COLS)
        c.gx = col * (W + gx) + (row % 2) * (W + gx) * 0.5
        c.gy = row * (rowH + gy)
      })
      P = { x: COLS * (W + gx), y: ROWS * (rowH + gy) }
      Rfull = Math.max(w, h) * (phone ? 1.0 : 0.8)
      Rball = Math.min(w, h) * (phone ? 0.24 : 0.2)
      if (!meshes.length)
        clusters.forEach((c) =>
          c.tiles.forEach((t) => {
            const tex = loader.load(t.src, () => (dirty = true))
            tex.colorSpace = THREE.SRGBColorSpace
            tex.anisotropy = aniso
            textures.push(tex)
            const mat = new THREE.ShaderMaterial({
              uniforms: { uMap: { value: tex }, uC: { value: C }, uR: { value: 1 }, uRect: { value: new THREE.Vector4() }, uAlpha: { value: 0 }, uSize: { value: new THREE.Vector2() }, uLift: { value: 0 }, uLiftAt: { value: new THREE.Vector2() } },
              vertexShader: VERT,
              fragmentShader: FRAG,
              transparent: true,
              depthTest: false,
              side: THREE.DoubleSide,
            })
            const m = new THREE.Mesh(geo, mat)
            m.frustumCulled = false
            scene.add(m)
            meshes.push({ m, c: c.i, t })
          }),
        )
      else meshes.forEach((it) => (it.t = clusters[it.c].tiles[clusters[it.c].tiles.findIndex((t) => t.src === it.t.src)]))
    }
    const resize = () => {
      w = el.clientWidth
      h = el.clientHeight
      renderer.setSize(w, h, false)
      camera.right = w
      camera.bottom = h
      camera.updateProjectionMatrix()
      C.set(w / 2, h * 0.54)
      ballMat.uniforms.uRes.value.set(w * dpr, h * dpr)
      layout()
      dirty = true
    }
    let dirty = true
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    // spinning: x is longitude (px of page at the full radius), y moves the rows over the crest
    const view = { x: 0, y: 0, tx: 0, ty: 0, vx: 0 }
    view.x = view.tx = P.x * 0.06
    view.y = view.ty = P.y / ROWS / 2 // two rows either side of the middle
    let dragging = false, pid = -1, lastX = 0, lastY = 0, lastT = 0, moved = 0, lastInput = 0
    let hovered = -1
    const pointer = { x: -9999, y: -9999 }

    // screen px -> page px, by inverting the wrap (only meaningful on the ball)
    const toPage = (sx: number, sy: number) => {
      const dx = (sx - C.x) / R, dy = (sy - C.y) / R
      const r2 = dx * dx + dy * dy
      if (r2 >= 1) return null
      const v = Math.asin(dy), u = Math.atan2(dx, Math.sqrt(1 - r2))
      return { x: C.x + u * R, y: C.y + v * R }
    }
    const project = (px: number, py: number) => {
      const u = (px - C.x) / R, v = (py - C.y) / R
      return { x: C.x + R * Math.cos(v) * Math.sin(u), y: C.y + R * Math.sin(v), face: Math.cos(v) * Math.cos(u) }
    }
    // where a cluster's top-left sits on the page right now, wrapped to the copy nearest the centre
    const origin = (c: Cluster) => ({
      x: C.x + wrap(c.gx + c.w / 2 - view.x, P.x) - c.w / 2,
      y: C.y + wrap(c.gy + c.h / 2 - view.y, P.y) - c.h / 2,
    })

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || pid !== -1) return
      pid = e.pointerId
      dragging = true
      moved = 0
      view.vx = 0
      view.tx = view.x
      lastX = e.clientX
      lastY = e.clientY
      lastT = performance.now()
      lastInput = lastT
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      dirty = true
      if (!dragging || e.pointerId !== pid) return
      const now = performance.now()
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId)
      const k = Rfull / R
      view.tx -= dx * 1.6 * k
      if (e.pointerType === 'mouse') view.ty -= dy * 1.2 * k
      const dt = Math.max((now - lastT) / 1000, 1 / 60)
      view.vx = view.vx * 0.6 + ((-dx * 1.6 * k) / dt) * 0.4
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
      lastInput = now
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pid) return
      dragging = false
      pid = -1
      view.vx = Math.max(-4000, Math.min(4000, view.vx))
      if (moved < 6 && hovered >= 0) pick(hovered)
    }
    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== pid) return
      dragging = false
      pid = -1
    }
    const onLeave = () => {
      pointer.x = pointer.y = -9999
      dirty = true
    }
    const pick = (i: number) => {
      lift[i] = 1.6 // a push, then the machine
      setTimeout(() => setOpen(PRODUCTS[i].slug), reduce ? 0 : 260)
    }
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onCancel)
    el.addEventListener('pointerleave', onLeave)

    api.current = {
      goTo(s) {
        PRODUCTS.forEach((p, i) => (dim[i] = s && shelfOf(p) !== s ? 1 : 0))
        if (s) {
          let best = -1, bd = Infinity
          clusters.forEach((c, i) => {
            if (shelfOf(PRODUCTS[i]) !== s) return
            const dx = wrap(c.gx + c.w / 2 - view.tx, P.x), dy = wrap(c.gy + c.h / 2 - view.ty, P.y)
            const d = Math.hypot(dx, dy)
            if (d < bd) ((bd = d), (best = i))
          })
          if (best >= 0) {
            const c = clusters[best]
            view.tx += wrap(c.gx + c.w / 2 - view.tx, P.x)
            view.ty += wrap(c.gy + c.h / 2 - view.ty, P.y)
            view.vx = 0
          }
        }
        lastInput = performance.now()
        dirty = true
      },
    }

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(el)
    let raf = 0, prev = performance.now(), spin = 0, lastG = -1
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      const g = reduce ? 1 : grow ? grow.get() : 1

      // the arrival: a ball out of nothing, a spinning hold, the swell, then the tiles
      const born = ease(clamp01(g / 0.25)), swell = ease(clamp01((g - 0.45) / 0.45))
      R = Math.max(1, Rball * born + (Rfull - Rball) * swell)
      const tilesIn = clamp01((g - 0.72) / 0.28)
      const interactive = g > 0.98
      if (chrome.current) chrome.current.dataset.on = interactive ? '1' : '0'

      // motion: inertia while free, a slow drift when nobody has touched it for a while
      if (!dragging) {
        view.tx += view.vx * dt
        view.vx *= Math.pow(0.04, dt)
        if (!reduce && now - lastInput > 3000) view.tx += dt * (interactive ? 22 : 0)
      }
      const before = view.x + view.y
      view.x += (view.tx - view.x) * (reduce ? 1 : 1 - Math.pow(0.0005, dt))
      view.y += (view.ty - view.y) * (reduce ? 1 : 1 - Math.pow(0.0005, dt))
      if (!reduce) spin += dt * (1 - swell) * 1.4 // the ball turns on its own while small
      const moving = Math.abs(view.x + view.y - before) > 0.01 || g !== lastG || (!reduce && (1 - swell > 0.001 || now - lastInput > 3000))
      lastG = g

      ballMat.uniforms.uR.value = R
      ballMat.uniforms.uSpin.value = spin + view.x / R
      ballMat.uniforms.uShiftY.value = -view.y / R
      ballMat.uniforms.uTilt.value = 0.41 * (1 - swell) // the tipped little globe straightens as it becomes the floor
      ball.visible = g > 0.001

      // hover: which cluster is under the pointer
      let nh = -1
      if (interactive && !dragging) {
        const pp = toPage(pointer.x, pointer.y)
        if (pp)
          clusters.forEach((c, i) => {
            const o = origin(c)
            if (pp.x >= o.x && pp.x <= o.x + c.w && pp.y >= o.y && pp.y <= o.y + c.h && dim[i] < 0.5) nh = i
          })
      }
      if (nh !== hovered) {
        hovered = nh
        el.style.cursor = nh >= 0 ? 'pointer' : 'grab'
      }

      let animating = moving || dirty
      clusters.forEach((c, i) => {
        const o = origin(c)
        const want = i === hovered ? 1 : 0
        lift[i] += (want - lift[i]) * (reduce ? 1 : 0.16)
        if (Math.abs(want - lift[i]) > 0.003) animating = true
        // land from the centre outward
        const dist = Math.hypot(o.x + c.w / 2 - C.x, o.y + c.h / 2 - C.y) / Math.max(w, h)
        const appear = ease(clamp01((tilesIn - dist * 0.5) / 0.5))
        const el2 = labels.current[i]
        if (el2) {
          const p = project(o.x, o.y + c.h + 10)
          const show = interactive && p.face > 0.55 && dim[i] < 0.5
          el2.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`
          el2.style.opacity = show ? String(clamp01((p.face - 0.55) / 0.2)) : '0'
          el2.tabIndex = show ? 0 : -1
          el2.dataset.hover = i === hovered ? '1' : '0'
        }
        c.o = o
        c.a = appear * (1 - dim[i] * 0.82)
      })
      meshes.forEach(({ m, c, t }) => {
        const cl = clusters[c]
        const u = (m.material as THREE.ShaderMaterial).uniforms
        u.uR.value = R
        u.uRect.value.set(cl.o.x + t.x, cl.o.y + t.y, t.w, t.h)
        u.uSize.value.set(t.w, t.h)
        u.uAlpha.value = cl.a
        u.uLift.value = lift[c]
        u.uLiftAt.value.set(cl.o.x + cl.w / 2, cl.o.y + cl.h / 2)
        m.visible = cl.a > 0.002
      })
      if (coords.current) {
        const lon = ((((view.x / Rfull) * 180) / Math.PI + 180) % 360 + 360) % 360 - 180
        coords.current.textContent = `${fmt(lon)}   ${view.y > 0 ? 'S' : 'N'} ${Math.abs(wrap(view.y, P.y) / Rfull * 57.3).toFixed(1).padStart(4, '0')}°`
      }
      if (animating) {
        renderer.render(scene, camera)
        dirty = false
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onCancel)
      el.removeEventListener('pointerleave', onLeave)
      textures.forEach((t) => t.dispose())
      geo.dispose()
      renderer.dispose()
    }
  }, [grow, reduce])

  const pick = (s: string | null) => {
    setShelf(s)
    api.current?.goTo(s)
  }

  return (
    <div className="globe">
      {failed ? (
        <div className="floor-flat">
          {PRODUCTS.map((x) => (
            <button key={x.slug} type="button" className="floor-flat-pile" onClick={() => setOpen(x.slug)}>
              <img src={prints(x)[0]} alt="" width={900} height={1125} loading="lazy" />
              <span>{x.name}</span>
            </button>
          ))}
        </div>
      ) : (
        <div ref={host} className="globe-world">
          <canvas ref={canvasRef} aria-hidden />
          <div className="globe-labels">
            {PRODUCTS.map((x, i) => (
              <button
                key={x.slug}
                ref={(b) => {
                  labels.current[i] = b
                }}
                type="button"
                className={`pile-label ink-${tintOf(x)}`}
                onClick={() => setOpen(x.slug)}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <b>{x.name === 'Untitled' ? `Untitled, ${plateNo(x)}` : x.name}</b>
                <span>{priceLabel(x).replace(' a month', '/mo').replace(' early access', ' early')}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div ref={chrome} className="globe-chrome" data-on={failed ? '1' : '0'}>
        <header className="masthead">
          <div className="mh-cell mh-brand">
            <b>Kognivo</b> <i>the shop floor</i>
          </div>
          <div className="mh-cell">Software, hardware and projects</div>
          <div className="mh-cell mh-coords" aria-hidden>
            <span>you are at</span>
            <span ref={coords}>E 000.0°   N 00.0°</span>
          </div>
          <div className="mh-cell mh-hint">Drag to spin the globe. Click a pile.</div>
          <Link href="/commission" className="mh-cell mh-cta">
            Commission a build
          </Link>
        </header>
        <nav className="floor-shelves" aria-label="Spin to a shelf">
          <button type="button" aria-pressed={shelf === null} onClick={() => pick(null)}>
            Everything
          </button>
          {SHELVES.map((s) => (
            <button key={s.id} type="button" className={`ink-${TINT[s.id]}`} aria-pressed={shelf === s.id} onClick={() => pick(s.id)}>
              {s.name}
            </button>
          ))}
        </nav>
      </div>
      <SlotMachine slug={open} onClose={() => setOpen(null)} />
    </div>
  )
}
