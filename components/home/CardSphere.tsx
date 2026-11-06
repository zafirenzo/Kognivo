'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { MotionValue } from 'motion/react'
import { PRODUCTS, prints } from '@/lib/catalogue'

/**
 * A ball of prints: every product's posters, laid on a sphere and turning, the far side sinking into the
 * pink. `g` (0..1) runs it: out of the spark (0 to .22), turning (to .55), then every card flies outward and
 * past the camera (.55 to 1) as the star opens on the floor behind. Pointer leans it a little.
 */
const CARDS = PRODUCTS.flatMap((x) => prints(x))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1)

export function CardSphere({ g }: { g: MotionValue<number> }) {
  const ref = useRef<HTMLCanvasElement>(null)
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
    scene.fog = new THREE.Fog(new THREE.Color('#ffb8e0'), 9, 13.5)
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60)
    camera.position.set(0, 0, 10)
    const ball = new THREE.Group()
    scene.add(ball)

    const R = 2.6
    const loader = new THREE.TextureLoader()
    const geo = new THREE.PlaneGeometry(0.56, 0.7)
    const n = CARDS.length
    const cards = CARDS.map((src, i) => {
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
      m.rotateZ((Math.sin(i * 7.3) * 0.25))
      ball.add(m)
      return { m, dir, speed: 0.7 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.8, spin: Math.sin(i * 3.1) }
    })

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      ball.userData.fit = Math.min(1, (w / h) * 0.75) // keep the whole ball on a phone
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()

    const lean = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => {
      lean.tx = (e.clientX / innerWidth - 0.5) * 0.5
      lean.ty = (e.clientY / innerHeight - 0.5) * 0.35
    }
    addEventListener('pointermove', onMove, { passive: true })

    let raf = 0, t = 0, prev = performance.now()
    const toEye = new THREE.Vector3()
    const inv = new THREE.Quaternion()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const v = g.get()
      if (v <= 0.001 || v >= 0.999) {
        canvas.style.visibility = 'hidden'
        return
      }
      canvas.style.visibility = 'visible'
      const dt = Math.min((now - prev) / 1000, 0.05)
      prev = now
      t += dt
      const born = ease(clamp01(v / 0.22))
      const burst = clamp01((v - 0.55) / 0.45)
      lean.x += (lean.tx - lean.x) * 0.06
      lean.y += (lean.ty - lean.y) * 0.06
      ball.scale.setScalar(Math.max(0.001, born * (ball.userData.fit ?? 1)))
      ball.position.y = -0.25 // the spark sits a little below the middle, between the fingertips
      ball.rotation.set(0.28 + lean.y, t * 0.32 + v * 3.2 + lean.x, 0)
      inv.copy(ball.quaternion).invert()
      cards.forEach((c) => {
        // fly out along the card's own direction and toward the camera, faster for some than others
        const e = Math.pow(burst, 1.6) * c.speed
        c.m.position.copy(c.dir).multiplyScalar(R * (1 + e * 4.5))
        // toward the camera in world space, expressed in the ball's own turned, scaled space
        c.m.position.add(toEye.set(0, 0, (e * 9) / ball.scale.x).applyQuaternion(inv))
        ;(c.m.material as THREE.MeshBasicMaterial).opacity = 1 - clamp01((burst - 0.35) / 0.65)
        c.m.rotation.z += dt * c.spin * burst * 3
      })
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      removeEventListener('pointermove', onMove)
      cards.forEach((c) => {
        ;(c.m.material as THREE.MeshBasicMaterial).map?.dispose()
        ;(c.m.material as THREE.MeshBasicMaterial).dispose()
      })
      geo.dispose()
      renderer.dispose()
    }
  }, [g])
  return <canvas ref={ref} className="card-sphere" aria-hidden />
}
