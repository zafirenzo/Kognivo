'use client'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useReduced } from './hooks'

function Letter({ ch, i, n, p }: { ch: string; i: number; n: number; p: MotionValue<number> }) {
  // Outer letters rise first, the centre last: a shallow wave.
  const d = (Math.abs(i - (n - 1) / 2) / n) * 0.35
  const y = useTransform(p, [0.3 - d, 1 - d], ['100%', '0%'])
  return (
    <motion.span style={{ y }} className="rise-letter">
      {ch}
    </motion.span>
  )
}

/** The footer wordmark, its letters rising out of the floor as the page ends. */
export function RisingWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const letters = [...text]
  return (
    <div ref={ref} aria-hidden className="wordmark-rise">
      <p>{reduce ? text : letters.map((ch, i) => <Letter key={i} ch={ch} i={i} n={letters.length} p={scrollYProgress} />)}</p>
    </div>
  )
}
