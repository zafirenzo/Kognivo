'use client'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { useReduced } from './hooks'

type Pill = { src: string; pos?: string }
export type HeadlineLine = (string | Pill)[]

function Window({ pill, progress, delay }: { pill: Pill; progress: MotionValue<number>; delay: number }) {
  const w = useTransform(progress, [delay, delay + 0.45], [0, 2.1])
  const width = useTransform(w, (v) => `${v}em`)
  const scale = useTransform(progress, [delay, delay + 0.45], [1.5, 1])
  return (
    <motion.span aria-hidden style={{ width }} className="ih-window">
      <motion.img src={pill.src} alt="" style={{ scale, objectPosition: pill.pos ?? 'center' }} />
    </motion.span>
  )
}

/** Big set lines where small plate windows open between the words as the block reaches the middle of the screen. */
export function InlinePlateHeadline({ lines, label }: { lines: HeadlineLine[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.95', 'center 0.5'] })
  let n = 0
  return (
    <h2 ref={ref} aria-label={label} className="ih">
      {lines.map((line, li) => (
        <span key={li} aria-hidden className="ih-line">
          {line.map((seg, si) => {
            if (typeof seg === 'string') return <span key={si}>{seg}</span>
            const delay = Math.min(0.1 + n++ * 0.16, 0.5)
            return reduce ? (
              <span key={si} className="ih-window" style={{ width: '2.1em' }}>
                <img src={seg.src} alt="" style={{ objectPosition: seg.pos ?? 'center' }} />
              </span>
            ) : (
              <Window key={si} pill={seg} progress={scrollYProgress} delay={delay} />
            )
          })}
        </span>
      ))}
    </h2>
  )
}
