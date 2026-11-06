'use client'
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import Link from 'next/link'
import { useRef, type ElementType, type ReactNode } from 'react'
import { useReduced, EASE } from './motion/hooks'

/**
 * Type printed on a risograph: the same words on two or three drums, never quite in register.
 * The copies slide apart as the heading travels through the screen and land almost aligned
 * in the middle, the way a print run settles. Screen readers get the text once.
 */
export function RisoText({ text, as = 'h2', className = '', inks = 2 }: { text: string; as?: ElementType; className?: string; inks?: 2 | 3 }) {
  const Tag = as
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const drift = useTransform(scrollYProgress, [0, 0.45, 1], [30, 7, -22])
  const dx = useSpring(drift, { stiffness: 120, damping: 20 })
  const dy = useTransform(dx, (v) => v * -0.35)
  const x2 = useTransform(dx, (v) => -v * 0.6)
  const y2 = useTransform(dx, (v) => v * 0.5)
  const s = reduce ? { x: 6, y: -2 } : { x: dx, y: dy }
  const s2 = reduce ? undefined : { x: x2, y: y2 }
  return (
    <Tag ref={ref} className={`riso ${className}`}>
      <span className="riso-base">{text}</span>
      <motion.span aria-hidden className="riso-l1" style={s}>{text}</motion.span>
      {inks === 3 && <motion.span aria-hidden className="riso-l2" style={s2}>{text}</motion.span>}
    </Tag>
  )
}

/** A note written on the print in pen, with an arrow that draws itself in. */
export function Scribble({ children, arrow = 'down-right', className = '' }: { children: ReactNode; arrow?: 'down-right' | 'down-left' | 'right' | 'down'; className?: string }) {
  const reduce = useReduced()
  const paths: Record<string, string> = {
    'down-right': 'M6 8 C 30 6, 64 18, 78 52 M64 44 L78 54 L82 38',
    'down-left': 'M78 8 C 54 8, 20 20, 8 52 M6 36 L8 54 L24 46',
    right: 'M4 30 C 26 18, 54 40, 84 26 M70 16 L86 26 L72 38',
    down: 'M40 4 C 30 24, 52 40, 40 66 M28 54 L40 68 L52 56',
  }
  return (
    <span className={`scribble scribble-${arrow} ${className}`}>
      <span>{children}</span>
      <svg viewBox="0 0 90 72" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d={paths[arrow]}
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.9, delay: 0.4, ease: EASE }}
        />
      </svg>
    </span>
  )
}
