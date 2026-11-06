'use client'
import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useReduced } from '../motion/hooks'
import { Floor } from './Floor'

/**
 * Two printed hands slide in over the pink and almost touch. A spark jumps the gap, opens into a star,
 * and the star is a window: through it is the shop floor. The hands pull apart and the star grows until
 * the floor is all there is. Under reduced motion the hands rest apart above the floor.
 */
export function Creation() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.35 })
  const [live, setLive] = useState(false)
  const [done, setDone] = useState(false)
  useMotionValueEvent(p, 'change', (v) => {
    if (v > 0.45 && !live) setLive(true)
    setDone(v > 0.985)
  })

  // the first quarter is the section scrolling up into view over the end of the opening
  const gap = useTransform(p, [0.25, 0.52, 0.6, 0.95], [34, 1.2, 1.2, 70])
  const leftX = useTransform(gap, (g) => `calc(-91.3% - ${g / 2}vw)`)
  const rightX = useTransform(gap, (g) => `calc(-7.5% + ${g / 2}vw)`)
  const handsY = useTransform(p, [0.25, 0.55, 0.95], ['6vh', '0vh', '-8vh'])
  const handsOpacity = useTransform(p, [0.9, 0.98], [1, 0])
  const star = useTransform(p, [0.52, 0.6, 0.98], [0, 9, 300])
  const mask = useTransform(star, (s) => `${s}vmax ${s}vmax`)
  const spin = useTransform(p, [0.52, 0.98], [0, 70])
  const words = useTransform(p, [0.2, 0.95], ['10%', '-62%'])
  const wordsOpacity = useTransform(p, [0.2, 0.3, 0.8, 0.9], [0, 1, 1, 0])
  const flash = useTransform(p, [0.5, 0.53, 0.58], [0, 1, 0])

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
            <motion.p className="creation-words" style={{ x: words, opacity: wordsOpacity }} aria-hidden>
              then made to work.
            </motion.p>
            <motion.div className="creation-hands" style={{ y: handsY, opacity: handsOpacity }} aria-hidden>
              <motion.img className="hand hand-left" src="/prints/hand-left.webp" alt="" width={1500} height={760} style={{ x: leftX }} />
              <motion.img className="hand hand-right" src="/prints/hand-right.webp" alt="" width={1500} height={760} style={{ x: rightX }} />
              <motion.svg className="creation-spark" viewBox="0 0 100 100" style={{ opacity: flash, rotate: spin }}>
                <path d="M50 0 C53 34 66 47 100 50 C66 53 53 66 50 100 C47 66 34 53 0 50 C34 47 47 34 50 0Z" />
              </motion.svg>
            </motion.div>
          </>
        )}
      </div>
      <span id="floor" className="floor-anchor" />
    </section>
  )
}
