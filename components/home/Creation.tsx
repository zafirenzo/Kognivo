'use client'
import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useReduced } from '../motion/hooks'
import { Floor } from './Floor'
import { CardSphere } from './CardSphere'

/**
 * Michelangelo's two hands (cut out and reprinted riso by scripts/creation.py) slide in over the pink and
 * almost touch. A spark jumps the gap, and out of it comes a ball of prints, every product turning on a
 * sphere. The hands pull apart, the ball bursts and its cards fly past you, and the spark's star opens into
 * a window onto the shop floor, growing until the floor is all there is.
 * Under reduced motion: the floor, already arrived.
 */
export function Creation() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.35 })
  const [live, setLive] = useState(false)
  const [done, setDone] = useState(false)
  useMotionValueEvent(p, 'change', (v) => {
    if (v > 0.6 && !live) setLive(true)
    setDone(v > 0.985)
  })

  // the first quarter is the section scrolling up into view over the end of the opening
  const gap = useTransform(p, [0.25, 0.5, 0.56, 0.92], [34, 1, 1, 74])
  // each print is placed so its fingertip sits on the middle of the screen, then pushed out by half the gap
  const leftX = useTransform(gap, (g) => `calc(-93% - ${g / 2}vw)`)
  const rightX = useTransform(gap, (g) => `calc(-3.3% + ${g / 2}vw)`)
  const handsY = useTransform(p, [0.25, 0.55, 0.95], ['6vh', '0vh', '-8vh'])
  const handsOpacity = useTransform(p, [0.88, 0.96], [1, 0])
  const flash = useTransform(p, [0.48, 0.51, 0.56], [0, 1, 0])
  const flashScale = useTransform(p, [0.48, 0.51, 0.56], [0.3, 1.3, 0.5])
  const spin = useTransform(p, [0.48, 0.98], [0, 80])
  const ball = useTransform(p, [0.5, 0.95], [0, 1])
  const star = useTransform(p, [0.74, 0.8, 0.98], [0, 9, 300])
  const mask = useTransform(star, (s) => `${s}vmax ${s}vmax`)
  const line = useTransform(p, [0.26, 0.3, 0.44, 0.47], [0, 1, 1, 0])
  const lineY = useTransform(p, [0.26, 0.47], [20, -20])

  if (reduce)
    return (
      <section className="creation is-still" aria-label="The shop floor">
        <span id="floor" className="floor-anchor" />
        <div className="creation-stage">
          <Floor />
        </div>
      </section>
    )

  return (
    <section ref={ref} className="creation" aria-label="The shop floor">
      <div className="creation-stage">
        <motion.div className="creation-floor" style={done ? undefined : { WebkitMaskSize: mask, maskSize: mask }} data-done={done || undefined}>
          {live && <Floor />}
        </motion.div>
        {!done && (
          <>
            <CardSphere g={ball} />
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
          </>
        )}
      </div>
      <span id="floor" className="floor-anchor" />
    </section>
  )
}
