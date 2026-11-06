'use client'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import { PRODUCTS, priceLabel, prints } from '@/lib/catalogue'
import { SlotMachine } from './SlotMachine'

/**
 * A ball of prints: every product's posters laid on a sphere, turning, the far side sinking into the paper.
 * `born` (0..1) brings it up out of the spark; `burst` (0..1) sends every card flying outward and past the
 * camera. While `live`, it is a toy: drag to spin it (it keeps the spin you gave it), hover a print to lift
 * it, click one to pull the machine for that product.
 */
const CARDS = PRODUCTS.flatMap((x) => prints(x).map((src) => ({ src, slug: x.slug })))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)
const FOG = '#f7f3ea'

export function CardSphere({ born, burst, live }: { born: MotionValue<number>; burst: MotionValue<number>; live: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const liveRef = useRef(live)
  liveRef.current = live
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(new THREE.Color(FOG), 9.2, 13.4)
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
    camera.position.set(0, 0, 10)
    const ball = new THREE.Group()
    scene.add(ball)

    const R = 2.5
    const loader = new THREE.TextureLoader()
    const geo = new THREE.PlaneGeometry(0.56, 0.7)
    const n = CARDS.length
    const cards = CARDS.map(({ src, slug }, i) => {
      // a Fibonacci sphere: even spacing, no seams
      const y = 1 - (2 * (i + 0.5)) / n
      const r = Math.sqrt(1 - y * y)
      const th = i * Math.PI * (3 - Math.sqrt(5))
      const dir = new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r)
      const tex = loader.load(src)
      tex.colorSpace = THREE.SRGBColorSpace
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, fog: true }))
      m.position.copy(dir).multiplyScalar(R)
      m.lookAt(dir.clone().multiplyScalar(R * 2))
      m.rotateZ(Math.sin(i * 7.3) * 0.22)
      m.userData.i = i
      ball.add(m)
      return { m, dir, slug, lift: 0, speed: 0.7 + (((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1 * 0.8, spin: Math.sin(i * 3.1) }
    })

    let w = 1, h = 1
    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      ball.userData.fit = Math.min(1, (w / h) * 0.78) // the whole ball on a phone
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    // spinning by hand, with inertia; the ball turns on its own when left alone
    const rot = { x: 0.28, y: 0, vx: 0, vy: 0.32 }
    let dragging = false, pid = -1, lastX = 0, lastY = 0, moved = 0, lastT = 0, idleSince = 0
    const ndc = new THREE.Vector2(9, 9)
    const ray = new THREE.Raycaster()
    let hovered = -1
    const onDown = (e: PointerEvent) => {
      if (!liveRef.current || pid !== -1) return
      pid = e.pointerId
      dragging = true
      moved = 0
      lastX = e.clientX
      lastY = e.clientY
      lastT = performance.now()
    }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      if (tip.current) tip.current.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 18}px)`
      if (!dragging || e.pointerId !== pid) return
      const now = performance.now()
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      moved += Math.abs(dx) + Math.abs(dy)
      if (moved > 6 && !canvas.hasPointerCapture(e.pointerId)) canvas.setPointerCapture(e.pointerId)
      const dt = Math.max((now - lastT) / 1000, 1 / 120)
      rot.y += dx * 0.006
      rot.x = Math.max(-1.1, Math.min(1.1, rot.x + dy * 0.004))
      rot.vy = rot.vy * 0.5 + ((dx * 0.006) / dt) * 0.5
      rot.vx = rot.vx * 0.5 + ((dy * 0.004) / dt) * 0.5
      lastX = e.clientX
      lastY = e.clientY
      lastT = now
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pid) return
      dragging = false
      pid = -1
      idleSince = performance.now()
      rot.vy = Math.max(-6, Math.min(6, rot.vy))
      rot.vx = Math.max(-3, Math.min(3, rot.vx))
      if (moved < 6 && hovered >= 0) setOpen(cards[hovered].slug)
    }
    const onLeave = () => ndc.set(9, 9)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('pointerleave', onLeave)

    let raf = 0, prev = performance.now(), visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(canvas)
    const toEye = new THREE.Vector3()
    const inv = new THREE.Quaternion()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const b = born.get(), x = burst.get()
      if (!visible || b <= 0.001 || x >= 0.999) {
        canvas.style.visibility = 'hidden'
        return
      }
      canvas.style.visibility = 'visible'
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      const isLive = liveRef.current && x < 0.02

      if (!dragging) {
        rot.y += rot.vy * dt
        rot.x += rot.vx * dt
        rot.x += (0.28 - rot.x) * (1 - Math.pow(0.3, dt)) // settle back to a slight tilt
        const drift = now - idleSince > 1200 ? (hovered >= 0 ? 0.03 : 0.32) : 0 // nearly still under the pointer, so a print is easy to catch
        rot.vy += (drift - rot.vy) * (1 - Math.pow(0.25, dt))
        rot.vx *= Math.pow(0.05, dt)
      }
      ball.scale.setScalar(Math.max(0.001, ease(b) * (ball.userData.fit ?? 1)))
      ball.position.y = -0.2
      ball.rotation.set(rot.x, rot.y + x * 2.4, 0)
      ball.updateMatrixWorld()

      // which print is under the pointer (only the near face counts)
      let nh = -1
      if (isLive && !dragging) {
        ray.setFromCamera(ndc, camera)
        const hit = ray.intersectObjects(ball.children, false).find((hh) => (hh.object as THREE.Mesh).getWorldPosition(toEye).z > 0)
        if (hit) nh = hit.object.userData.i as number
      }
      if (nh !== hovered) {
        hovered = nh
        canvas.style.cursor = !isLive ? '' : nh >= 0 ? 'pointer' : 'grab'
        if (tip.current) {
          const p = nh >= 0 ? PRODUCTS.find((pp) => pp.slug === cards[nh].slug) : null
          tip.current.dataset.on = p ? '1' : '0'
          if (p) tip.current.innerHTML = `<b>${p.name === 'Untitled' ? 'Coming soon' : p.name}</b><span>${priceLabel(p)}</span>`
        }
      }

      inv.copy(ball.quaternion).invert()
      const e0 = Math.pow(x, 1.6)
      cards.forEach((c, i) => {
        c.lift += ((i === hovered ? 1 : 0) - c.lift) * 0.18
        // fly out along the card's own direction and toward the camera, some faster than others
        const e = e0 * c.speed
        c.m.position.copy(c.dir).multiplyScalar(R * (1 + e * 4.5 + c.lift * 0.14))
        c.m.position.add(toEye.set(0, 0, (e * 9) / ball.scale.x).applyQuaternion(inv))
        c.m.scale.setScalar(1 + c.lift * 0.35)
        ;(c.m.material as THREE.MeshBasicMaterial).opacity = 1 - clamp01((x - 0.35) / 0.65)
        c.m.rotation.z += dt * c.spin * x * 3
      })
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('pointerleave', onLeave)
      cards.forEach((c) => {
        ;(c.m.material as THREE.MeshBasicMaterial).map?.dispose()
        ;(c.m.material as THREE.MeshBasicMaterial).dispose()
      })
      geo.dispose()
      renderer.dispose()
    }
  }, [born, burst])

  return (
    <>
      <canvas ref={ref} className="card-sphere" data-live={live || undefined} aria-hidden />
      <div ref={tip} className="sphere-tip" data-on="0" aria-hidden />
      <SlotMachine slug={open} onClose={() => setOpen(null)} />
    </>
  )
}
