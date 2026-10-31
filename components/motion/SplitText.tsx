'use client'
import { motion, type Variants } from 'motion/react'
import { Fragment, type ElementType } from 'react'
import { useReduced, EASE } from './hooks'

const wrap: Variants = { hidden: {}, show: (stagger: number) => ({ transition: { staggerChildren: stagger, delayChildren: 0.1 } }) }
const char: Variants = {
  hidden: { y: '108%', rotate: 4 },
  show: { y: '0%', rotate: 0, transition: { duration: 0.9, ease: EASE } },
}

/**
 * Per-letter rise, as if each sort were set into the line one at a time. Words never break,
 * and the visible letters sit behind one aria-label for screen readers.
 */
export function SplitText({ text, as = 'span', className = '', stagger = 0.022 }: { text: string; as?: ElementType; className?: string; stagger?: number }) {
  const reduce = useReduced()
  const Tag = as
  if (reduce) return <Tag className={className}>{text}</Tag>
  const words = text.split(' ')
  return (
    <Tag className={className} aria-label={text}>
      <motion.span aria-hidden initial="hidden" whileInView="show" viewport={{ once: true, margin: '-10% 0px' }} variants={wrap} custom={stagger}>
        {words.map((word, w) => (
          <Fragment key={w}>
            <span className="split-word">
              <span className="split-mask">
                {[...word].map((c, i) => (
                  <motion.span key={i} variants={char} className="split-char">
                    {c}
                  </motion.span>
                ))}
              </span>
            </span>
            {w < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  )
}
