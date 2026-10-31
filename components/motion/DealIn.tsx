'use client'
import { motion } from 'motion/react'
import { Children, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery, useReduced } from './hooks'

/**
 * Plates dealt out of the open case: every item starts stacked on the first one, slightly
 * fanned, then springs to its own place in the grid. Offsets are measured from the real
 * layout, so any grid shape works. Phones: items rise in one by one.
 */
export function DealIn({ children, className = '' }: { children: ReactNode; className?: string }) {
  const reduce = useReduced()
  const wide = useMediaQuery('(min-width: 900px)')
  const items = Children.toArray(children)
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [off, setOff] = useState<{ x: number; y: number }[] | null>(null)

  useLayoutEffect(() => {
    if (!wide || reduce) return
    const first = refs.current[0]?.getBoundingClientRect()
    if (!first) return
    setOff(refs.current.map((el) => {
      const r = el!.getBoundingClientRect()
      return { x: first.left - r.left, y: first.top - r.top }
    }))
  }, [wide, reduce, items.length])

  if (reduce) return <div className={className}>{items}</div>
  const ready = !wide || off
  return (
    <motion.div key={`${wide}-${Boolean(off)}`} className={className} initial="stacked" whileInView={ready ? 'dealt' : undefined} viewport={{ once: true, margin: '-12% 0px' }}>
      {items.map((child, i) => (
        <motion.div
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="deal"
          variants={{
            stacked: wide ? { x: off?.[i]?.x ?? 0, y: off?.[i]?.y ?? 0, rotate: i === 0 ? 0 : ((i % 5) - 2) * 2.2 } : { y: 48, opacity: 0 },
            dealt: { x: 0, y: 0, rotate: 0, opacity: 1 },
          }}
          style={{ zIndex: items.length - i }}
          transition={{ type: 'spring', stiffness: 80, damping: 17, delay: 0.08 + i * 0.07 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
