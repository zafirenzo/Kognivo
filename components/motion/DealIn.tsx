'use client'
import { motion } from 'motion/react'
import { Children, type ReactNode } from 'react'
import { useMediaQuery, useReduced } from './hooks'

/**
 * Plates dealt out of the open case: every plate starts stacked on the first slot, slightly
 * fanned, then springs to its own place in the grid. `cols` is the desktop column count.
 */
export function DealIn({ children, className = '', cols = 4 }: { children: ReactNode; className?: string; cols?: number }) {
  const reduce = useReduced()
  const wide = useMediaQuery('(min-width: 900px)')
  const items = Children.toArray(children)
  if (reduce) return <div className={className}>{items}</div>
  return (
    <motion.div key={String(wide)} className={className} initial="stacked" whileInView="dealt" viewport={{ once: true, margin: '-15% 0px' }}>
      {items.map((child, i) => {
        // Pl. I spans 2x2 in the top-left; the rest fill the remaining cells in order.
        const col = wide ? (i === 0 ? 0 : i <= 4 ? 2 + ((i - 1) % 2) : (i - 5) % cols) : 0
        const row = wide ? (i === 0 ? 0 : i <= 4 ? Math.floor((i - 1) / 2) : 2) : 0
        return (
          <motion.div
            key={i}
            className={`deal ${i === 0 ? 'deal-lead' : ''}`}
            variants={{
              stacked: wide ? { x: `${-col * 100}%`, y: `${-row * 100}%`, rotate: (i % 5) * 1.6 - 3, opacity: i === 0 ? 1 : 0.9 } : { y: 48, opacity: 0 },
              dealt: { x: 0, y: 0, rotate: 0, opacity: 1 },
            }}
            style={{ zIndex: items.length - i }}
            transition={{ type: 'spring', stiffness: 80, damping: 17, delay: 0.08 + i * 0.07 }}
          >
            {child}
          </motion.div>
        )
      })}
    </motion.div>
  )
}
