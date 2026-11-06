'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import Link from 'next/link'
import { PRODUCTS, SHELVES, plateNo, prints, priceLabel, shelfOf, type Product } from '@/lib/catalogue'
import { TINT, tintOf } from '../Chrome'
import { SlotMachine } from './SlotMachine'
import { useReduced } from '../motion/hooks'

/**
 * The shop floor. Every product is a little pile of its prints lying on a ruled floor that bends away
 * toward the horizon, like the top of a globe. Drag or scroll to travel (it wraps, so it never ends, all
 * the way round); pinch to rise or sink; arrow keys work too; pick a shelf to be walked
 * to it; click a pile to pull the lever. Labels are real buttons, so the floor works by keyboard too.
 */

const SPACING = 7.5
const COLS = 4
const ROWS = Math.ceil(PRODUCTS.length / COLS)
const PX = COLS * SPACING
const PZ = ROWS * SPACING
const CURVE = 0.013
const PAPER = new THREE.Color('#f7f3ea')

// Where each pile sits in the world, with a little jitter so the floor doesn't read as a table.
const SPOTS = PRODUCTS.map((x, i) => {
  const c = i % COLS, r = Math.floor(i / COLS)
  const j = (k: number) => (Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1
  return { x: c * SPACING + j(1) * 1.4 + (r % 2) * SPACING * 0.5, z: r * SPACING + j(2) * 1.2 }
})

// Layouts for the prints in a pile: [x, z, width] for each, in units; the first is the poster.
const LAYOUTS = [
  [[0, 0, 2.6], [2.25, -0.7, 1.4], [2.0, 1.15, 1.25], [-2.0, 1.2, 1.2]],
  [[0, 0, 2.6], [-2.2, -0.6, 1.35], [2.2, 0.5, 1.5], [0.2, 2.6, 1.15]],
  [[0, 0, 2.6], [2.3, 0.9, 1.4], [-2.1, 0.4, 1.3], [1.9, -1.4, 1.1]],
]

const fmt = (v: number) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(2).padStart(7, '0')

function wrap(v: number, center: number, period: number) {
  return ((((v - center + period / 2) % period) + period) % period) - period / 2 + center
}

const GRID_VERT = `
uniform vec2 uC; uniform float uK;
varying vec2 vW; varying float vD;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec2 d = w.xz - uC; float d2 = dot(d, d);
  w.y -= uK * d2; vW = w.xz; vD = sqrt(d2);
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const GRID_FRAG = `
uniform vec3 uPaper; uniform vec3 uInk;
varying vec2 vW; varying float vD;
float line(vec2 p, float s, float w){ vec2 g = abs(fract(p / s - 0.5) - 0.5) * s / fwidth(p); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
void main(){
  float fine = line(vW, 1.0, 1.0) * 0.07;
  float bold = line(vW, ${SPACING.toFixed(1)}, 1.2) * 0.2;
  float fade = smoothstep(46.0, 14.0, vD);
  vec3 c = mix(uPaper, uInk, max(fine, bold) * fade);
  gl_FragColor = vec4(c, 1.0);
}`

type Pile = { group: THREE.Group; x: Product; spot: { x: number; z: number }; tiles: THREE.Mesh[]; hover: number; dim: number; label?: HTMLButtonElement | null }

export function Floor() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labels = useRef<(HTMLButtonElement | null)[]>([])
  const coords = useRef<HTMLSpanElement>(null)
  const api = useRef<{ goTo: (shelf: string | null) => void } | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [shelf, setShelf] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const reduce = useReduced()

  useEffect(() => {
    const host = wrapRef.current, canvas = canvasRef.current
    if (!host || !canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.setClearColor(PAPER)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(PAPER, 26, 48)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200)
    const target = new THREE.Vector3(SPOTS[0].x + 2, 0, SPOTS[0].z + 2)
    const goal = target.clone()
    const vel = new THREE.Vector2()

    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140, 140, 140),
      new THREE.ShaderMaterial({
        uniforms: { uC: { value: new THREE.Vector2() }, uK: { value: CURVE }, uPaper: { value: PAPER }, uInk: { value: new THREE.Color('#16163a') } },
        vertexShader: GRID_VERT,
        fragmentShader: GRID_FRAG,
        extensions: { derivatives: true } as never,
      }),
    )
    grid.rotation.x = -Math.PI / 2
    scene.add(grid)

    const loader = new THREE.TextureLoader()
    const aniso = renderer.capabilities.getMaxAnisotropy()
    const texCache = new Map<string, THREE.Texture>()
    const tex = (src: string) => {
      if (!texCache.has(src)) {
        const t = loader.load(src, () => (dirty = true))
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = aniso
        texCache.set(src, t)
      }
      return texCache.get(src)!
    }

    const shadowTex = (() => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')!
      const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32)
      gr.addColorStop(0, 'rgba(22,22,58,0.35)')
      gr.addColorStop(1, 'rgba(22,22,58,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()

    const piles: Pile[] = PRODUCTS.map((x, i) => {
      const group = new THREE.Group()
      const layout = LAYOUTS[i % LAYOUTS.length]
      const srcs = prints(x)
      const tiles = srcs.map((src, k) => {
        const [lx, lz, w] = layout[k] ?? layout[layout.length - 1]
        const h = w * 1.25
        const mat = new THREE.MeshBasicMaterial({ map: tex(src), transparent: true, fog: true })
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
        m.rotation.x = -Math.PI / 2
        m.rotation.z = Math.sin(i * 3 + k * 1.7) * 0.12
        m.position.set(lx, 0.02 + k * 0.004, lz)
        m.userData = { pile: i, base: m.position.y, k }
        const sh = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.35, h * 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, fog: true }))
        sh.rotation.copy(m.rotation)
        sh.position.set(lx + 0.12, 0.005, lz + 0.18)
        group.add(sh)
        group.add(m)
        return m
      })
      scene.add(group)
      return { group, x, spot: SPOTS[i], tiles, hover: 0, dim: 0 }
    })

    let w = 0, h = 0
    const resize = () => {
      w = host.clientWidth
      h = host.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      dirty = true
    }
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    // walking: drag with inertia, and a slow drift when nobody is touching it
    let dragging = false, moved = 0, lastX = 0, lastY = 0, lastInput = performance.now()
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2(9, 9)
    let hovered = -1
    const unitsPerPx = () => (2 * camera.position.distanceTo(target) * Math.tan((camera.fov * Math.PI) / 360)) / h
    const onDown = (e: PointerEvent) => {
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
      lastInput = performance.now()
      host.setPointerCapture(e.pointerId)
    }
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      if (dragging) {
        const dx = e.clientX - lastX, dy = e.clientY - lastY
        moved += Math.abs(dx) + Math.abs(dy)
        const k = unitsPerPx()
        goal.x -= dx * k
        goal.z -= dy * k * 1.35
        vel.set(-dx * k, -dy * k * 1.35)
        lastX = e.clientX
        lastY = e.clientY
        lastInput = performance.now()
      }
      dirty = true
    }
    const onUp = (e: PointerEvent) => {
      dragging = false
      if (moved < 6 && hovered >= 0) setOpen(piles[hovered].x.slug)
      try {
        host.releasePointerCapture(e.pointerId)
      } catch {}
    }
    const onLeave = () => ndc.set(9, 9)
    host.addEventListener('pointerdown', onDown)
    host.addEventListener('pointermove', onMove)
    host.addEventListener('pointerup', onUp)
    host.addEventListener('pointerleave', onLeave)

    // scroll to travel (forward and back, sideways with shift or a sideways swipe), pinch to rise or sink
    let camH = 10.5
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        camH = Math.max(6, Math.min(18, camH + e.deltaY * 0.04))
      } else {
        const k = 0.0125 * (camH / 10.5)
        goal.x += (e.shiftKey ? e.deltaY : e.deltaX) * k
        if (!e.shiftKey) goal.z += e.deltaY * k
      }
      vel.set(0, 0)
      lastInput = performance.now()
      dirty = true
    }
    const onKey = (e: KeyboardEvent) => {
      const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key]
      if (!step) return
      e.preventDefault()
      goal.x += step[0]
      goal.z += step[1]
      lastInput = performance.now()
    }
    host.addEventListener('wheel', onWheel, { passive: false })
    host.addEventListener('keydown', onKey)

    api.current = {
      goTo(s) {
        piles.forEach((p) => (p.dim = s && shelfOf(p.x) !== s ? 1 : 0))
        if (!s) return void (dirty = true)
        // walk to the nearest pile on that shelf
        let best: Pile | null = null, bd = Infinity
        for (const p of piles) {
          if (shelfOf(p.x) !== s) continue
          const px = wrap(p.spot.x, goal.x, PX), pz = wrap(p.spot.z, goal.z, PZ)
          const d = Math.hypot(px - goal.x, pz - goal.z)
          if (d < bd) ((bd = d), (best = p))
        }
        if (best) goal.set(wrap(best.spot.x, goal.x, PX) + 1.5, 0, wrap(best.spot.z, goal.z, PZ) + 1.2)
        lastInput = performance.now()
        dirty = true
      },
    }

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(host)
    let dirty = true
    let raf = 0
    let prev = performance.now()
    const v3 = new THREE.Vector3()
    let camY = 10.5
    const born = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      if (!visible) return
      // inertia, then drift
      if (!dragging) {
        goal.x += vel.x
        goal.z += vel.y
        vel.multiplyScalar(reduce ? 0 : 0.92)
        if (!reduce && now - lastInput > 2500) goal.x += dt * 0.35
      }
      const before = target.x + target.z
      target.lerp(goal, reduce ? 1 : 0.12)
      const movedCam = Math.abs(target.x + target.z - before) > 1e-4
      camY += (camH - camY) * 0.12
      camera.position.set(target.x, camY, target.z + camY * 0.81)
      camera.lookAt(target.x, 0, target.z - 1.2)
      grid.position.set(Math.round(target.x), 0, Math.round(target.z))
      ;(grid.material as THREE.ShaderMaterial).uniforms.uC.value.set(target.x, target.z)

      // hover
      ray.setFromCamera(ndc, camera)
      const hit = ray.intersectObjects(piles.flatMap((p) => p.tiles), false)[0]
      const nh = hit ? (hit.object.userData.pile as number) : -1
      if (nh !== hovered) {
        hovered = nh
        host.style.cursor = nh >= 0 ? 'pointer' : 'grab'
        dirty = true
      }

      // arrival: the piles drop onto the floor, nearest first
      const intro = reduce ? 1 : Math.min((now - born) / 1600, 1)
      let animating = movedCam || dirty || intro < 1 || Math.abs(camH - camY) > 0.01
      piles.forEach((p, i) => {
        const px = wrap(p.spot.x, target.x, PX), pz = wrap(p.spot.z, target.z, PZ)
        const dx = px - target.x, dz = pz - target.z
        const want = i === hovered ? 1 : 0
        p.hover += (want - p.hover) * 0.18
        if (Math.abs(want - p.hover) > 0.002) animating = true
        // the floor bends away: drop each pile by the curve and tilt it to match the slope
        const land = Math.min(Math.max(intro * 1.7 - Math.hypot(dx, dz) / 40, 0), 1)
        const drop = (1 - land) * (1 - land) * 6
        p.group.position.set(px, -CURVE * (dx * dx + dz * dz) + p.hover * 0.35 + drop, pz)
        p.group.rotation.set(2 * CURVE * dz, 0, -2 * CURVE * dx)
        p.tiles.forEach((t, k) => {
          t.position.y = (t.userData.base as number) + p.hover * (0.18 + k * 0.1)
          const s = 1 + p.hover * 0.05
          t.scale.set(s, s, s)
          const m = t.material as THREE.MeshBasicMaterial
          m.opacity = (1 - p.dim * 0.78) * land
        })
        // the label follows its pile on screen
        const el = labels.current[i]
        if (el) {
          v3.set(px, p.group.position.y, pz + 2.1).project(camera)
          const sx = (v3.x * 0.5 + 0.5) * w, sy = (-v3.y * 0.5 + 0.5) * h
          const far = Math.hypot(dx, dz)
          const show = v3.z < 1 && far < 24 && p.dim < 0.5 && land > 0.9
          el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, 0)`
          el.style.opacity = show ? String(Math.max(0, Math.min(1, (24 - far) / 8))) : '0'
          el.tabIndex = show ? 0 : -1
          el.dataset.hover = i === hovered ? '1' : '0'
        }
      })
      if (coords.current) coords.current.textContent = `${fmt(target.x)}  ${fmt(-target.z)}`
      if (animating || !reduce) {
        renderer.render(scene, camera)
        dirty = false
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      host.removeEventListener('pointerdown', onDown)
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerup', onUp)
      host.removeEventListener('pointerleave', onLeave)
      host.removeEventListener('wheel', onWheel)
      host.removeEventListener('keydown', onKey)
      texCache.forEach((t) => t.dispose())
      renderer.dispose()
    }
  }, [reduce])

  const pick = (s: string | null) => {
    setShelf(s)
    api.current?.goTo(s)
  }

  return (
    <div className="floor" id="floor-stage">
      <header className="masthead">
        <h1 className="mh-cell mh-brand"><b>The Atlas</b> <i>of everything we make</i></h1>
        <div className="mh-cell">Software, hardware and projects</div>
        <div className="mh-cell mh-coords" aria-hidden>
          <span>position</span>
          <span ref={coords}>+0000.00  +0000.00</span>
        </div>
        <div className="mh-cell mh-hint">Drag to move. Scroll to travel. Click a pile.</div>
        <Link href="/commission" className="mh-cell mh-cta">Commission a build</Link>
      </header>
      <nav className="floor-shelves" aria-label="Walk to a shelf">
        <button type="button" aria-pressed={shelf === null} onClick={() => pick(null)}>Everything</button>
        {SHELVES.map((s) => (
          <button key={s.id} type="button" className={`ink-${TINT[s.id]}`} aria-pressed={shelf === s.id} onClick={() => pick(s.id)}>
            {s.name}
          </button>
        ))}
      </nav>
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
        <div ref={wrapRef} className="floor-world" tabIndex={0} aria-label="The Atlas. Use the arrow keys to move, or Tab to the product labels.">
          <canvas ref={canvasRef} aria-hidden />
          <div className="floor-labels">
            {PRODUCTS.map((x, i) => (
              <button
                key={x.slug}
                ref={(el) => {
                  labels.current[i] = el
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
      <SlotMachine slug={open} onClose={() => setOpen(null)} />
    </div>
  )
}
