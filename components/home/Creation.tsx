'use client'
import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useReduced } from '../motion/hooks'
import { Globe } from './Globe'

/**
 * The hands, printed riso from Michelangelo (public/prints/creation.webp), cut down the gap between the
 * fingers into two sheets. The sheets close until the fingers nearly touch, a spark jumps the gap, and the
 * sheets pull apart. Out of the spark comes a small spinning globe that swells until it is the shop floor.
 * Under reduced motion: the floor, already arrived.
 */
const SPLIT = '47.3%' // the gap between the fingertips, as a share of the print's width (and so of the stage)

export function Creation() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.35 })

  // the first quarter is this section rising over the end of the opening's flood
  const gap = useTransform(p, [0.22, 0.46, 0.56, 0.84], [22, 0, 0, 62])
  const leftX = useTransform(gap, (g) => `${-g / 2}vw`)
  const rightX = useTransform(gap, (g) => `${g / 2}vw`)
  const sheetsOpacity = useTransform(p, [0.8, 0.86], [1, 0])
  const flash = useTransform(p, [0.46, 0.5, 0.56], [0, 1, 0])
  const flashScale = useTransform(p, [0.46, 0.5, 0.56], [0.2, 1.4, 0.6])
  const spin = useTransform(p, [0.46, 0.56], [0, 90])
  const grow = useTransform(p, [0.5, 0.97], [0, 1])
  const line = useTransform(p, [0.24, 0.28, 0.44, 0.47], [0, 1, 1, 0])
  const lineY = useTransform(p, [0.24, 0.5], [20, -20])

  if (reduce)
    return (
      <section className="creation is-still" aria-label="The shop floor">
        <span id="floor" className="floor-anchor" />
        <div className="creation-stage">
          <Globe />
        </div>
      </section>
    )

  return (
    <section ref={ref} className="creation" aria-label="The shop floor">
      <div className="creation-stage">
        <div className="creation-floor">
          <Globe grow={grow} />
        </div>
        <motion.div className="creation-sheets" style={{ opacity: sheetsOpacity }} aria-hidden>
          <motion.div className="sheet sheet-left" style={{ x: leftX, width: SPLIT }}>
            <img src="/prints/creation.webp" alt="" width={1526} height={1763} />
          </motion.div>
          <motion.div className="sheet sheet-right" style={{ x: rightX, left: SPLIT }}>
            <img src="/prints/creation.webp" alt="" width={1526} height={1763} />
          </motion.div>
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
