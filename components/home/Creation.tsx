'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { useReduced } from '../motion/hooks'
import { wipeTo } from '../PageWipe'
import { CardSphere } from './CardSphere'

/**
 * Michelangelo's two hands (cut out and reprinted riso by scripts/creation.py) slide in over the pink and
 * almost touch. A spark jumps the gap. The hands pull apart and the spark's star opens like a window onto
 * the screen behind them: a ball of prints, every product turning on a sphere, which you can then spin and
 * click. Keep scrolling and the ball bursts, its cards fly past you, and you are carried into the Atlas
 * (/atlas), a page of its own, so scrolling there never drops you back into this.
 */
export function Creation() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const router = useRouter()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.35 })
  const [open, setOpen] = useState(false)
  const [live, setLive] = useState(false)
  useMotionValueEvent(p, 'change', (v) => {
    setOpen(v > 0.66)
    setLive(v > 0.6 && v < 0.88)
  })

  // the first sixth is this section rising over the end of the opening's flood
  const gap = useTransform(p, [0.17, 0.38, 0.43, 0.66], [34, 1, 1, 80])
  // each print is placed so its fingertip sits on the spark, then pushed out by half the gap
  const leftX = useTransform(gap, (g) => `calc(-93% - ${g / 2}vw)`)
  const rightX = useTransform(gap, (g) => `calc(-3.3% + ${g / 2}vw)`)
  const handsY = useTransform(p, [0.17, 0.4, 0.66], ['6vh', '0vh', '-6vh'])
  const handsOpacity = useTransform(p, [0.6, 0.66], [1, 0])
  const flash = useTransform(p, [0.37, 0.4, 0.46], [0, 1, 0])
  const flashScale = useTransform(p, [0.37, 0.4, 0.46], [0.3, 1.3, 0.6])
  const spin = useTransform(p, [0.37, 0.7], [0, 90])
  const star = useTransform(p, [0.41, 0.47, 0.66], [0, 9, 300])
  const mask = useTransform(star, (s) => `${s}vmax ${s}vmax`)
  const born = useTransform(p, [0.42, 0.6], [0, 1])
  const burst = useTransform(p, [0.88, 0.99], [0, 1])
  const line = useTransform(p, [0.18, 0.21, 0.34, 0.37], [0, 1, 1, 0])
  const lineY = useTransform(p, [0.18, 0.37], [20, -20])
  const cue = useTransform(p, [0.86, 0.99], [0, 1])
  const screenText = useTransform(p, [0.6, 0.66, 0.88, 0.92], [0, 1, 1, 0])

  // keep scrolling past the ball and you are carried into the Atlas, but only on a real scroll down:
  // never on the browser putting you back here, never twice
  const went = useRef(false)
  const scroll = useRef({ y: 0, down: false, at: 0, mounted: 0 })
  useEffect(() => {
    scroll.current = { y: scrollY, down: false, at: 0, mounted: performance.now() }
    const on = () => {
      const s = scroll.current
      s.down = scrollY > s.y
      s.y = scrollY
      s.at = performance.now()
    }
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const s = scroll.current, now = performance.now()
    if (v < 0.9) went.current = false
    if (v > 0.985 && !went.current && s.down && now - s.at < 250 && now - s.mounted > 1500) {
      went.current = true
      wipeTo(router, '/atlas', 'The Atlas', 'blue')
    }
  })

  if (reduce)
    return (
      <section className="creation is-still" aria-label="Everything we make">
        <span id="floor" className="floor-anchor" />
        <div className="creation-stage">
          <SphereScreen />
        </div>
      </section>
    )

  return (
    <section ref={ref} className="creation" aria-label="Everything we make">
      <div className="creation-stage">
        <motion.div className="creation-screen" style={open ? undefined : { WebkitMaskSize: mask, maskSize: mask }} data-open={open || undefined}>
          <motion.div style={{ opacity: screenText }} className="screen-text-wrap">
            <SphereScreen />
          </motion.div>
          <CardSphere born={born} burst={burst} live={live} />
          <motion.div className="atlas-cue" style={{ opacity: cue }} aria-hidden>
            <span>Into the Atlas</span>
            <motion.i style={{ scaleX: cue }} />
          </motion.div>
        </motion.div>
        <motion.div className="creation-hands" style={{ y: handsY, opacity: handsOpacity }} aria-hidden>
          <motion.img className="hand hand-left" src="/prints/hand-left.webp" alt="" width={960} height={760} style={{ x: leftX }} />
          <motion.img className="hand hand-right" src="/prints/hand-right.webp" alt="" width={1028} height={760} style={{ x: rightX }} />
          <motion.svg className="creation-spark" viewBox="0 0 100 100" style={{ opacity: flash, scale: flashScale, rotate: spin }}>
            <path d="M50 0 C53 34 66 47 100 50 C66 53 53 66 50 100 C47 66 34 53 0 50 C34 47 47 34 50 0Z" />
          </motion.svg>
        </motion.div>
        <motion.p className="creation-line" style={{ opacity: line, y: lineY }}>
          <span>then made to work.</span>
        </motion.p>
      </div>
      <span id="floor" className="floor-anchor" />
    </section>
  )
}

/** The words on the screen behind the hands. The ball does the showing; this says what to do with it. */
function SphereScreen() {
  return (
    <div className="sphere-screen">
      <p className="sphere-kicker">Pl. 0 · everything at once</p>
      <h2 className="sphere-title">The whole shop, in one ball.</h2>
      <p className="sphere-hint">Drag it to spin. Click a print to pull it out.</p>
      <a href="/atlas" className="btn sphere-cta">
        Open the Atlas <ArrowRight size={18} weight="bold" aria-hidden />
      </a>
    </div>
  )
}
