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

type Pile = { src: string; href: string; label: string; price: string; tint: string }

/**
 * The hero's pile of fresh prints. They lean on each other, follow the pointer a little
 * (each at its own depth), and drift apart as you scroll away. Reduced motion: they just lie there.
 */
export function PosterPile({ items }: { items: Pile[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReduced()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 60, damping: 14 })
  const sy = useSpring(py, { stiffness: 60, damping: 14 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const spread = useTransform(scrollYProgress, [0, 1], [0, 1])
  const place = [
    { x: -22, y: 8, r: -7, depth: 18, z: 1 },
    { x: 18, y: -6, r: 5, depth: 30, z: 2 },
    { x: -4, y: 20, r: -2, depth: 44, z: 3 },
  ]
  return (
    <div
      ref={ref}
      className="pile"
      onPointerMove={(e) => {
        if (reduce) return
        const r = e.currentTarget.getBoundingClientRect()
        px.set((e.clientX - r.left) / r.width - 0.5)
        py.set((e.clientY - r.top) / r.height - 0.5)
      }}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      {items.map((it, i) => (
        <PilePoster key={it.href} it={it} i={i} p={place[i]} sx={sx} sy={sy} spread={spread} reduce={reduce} />
      ))}
    </div>
  )
}

function PilePoster({ it, i, p, sx, sy, spread, reduce }: { it: Pile; i: number; p: { x: number; y: number; r: number; depth: number; z: number }; sx: MotionValue<number>; sy: MotionValue<number>; spread: MotionValue<number>; reduce: boolean }) {
  const x = useTransform(() => p.x + sx.get() * p.depth + spread.get() * (i - 1) * 140)
  const y = useTransform(() => p.y + sy.get() * p.depth - spread.get() * (60 + i * 50))
  const rotate = useTransform(() => p.r + sx.get() * 4 + spread.get() * (i - 1) * 9)
  const tf = useMotionTemplate`translate(${x}%, ${y}px) rotate(${rotate}deg)`
  return (
    <motion.div
      className={`pile-poster pile-${i}`}
      style={reduce ? { transform: `translate(${p.x}%, ${p.y}px) rotate(${p.r}deg)`, zIndex: p.z } : { transform: tf, zIndex: p.z }}
      initial={reduce ? false : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.15 + i * 0.14, ease: EASE }}
    >
      <Link href={it.href} className="poster">
        <img src={it.src} alt={it.label} width={900} height={1125} fetchPriority={i === 2 ? 'high' : 'auto'} />
        <span className={`sticker sticker-${it.tint}`}>{it.price}</span>
      </Link>
    </motion.div>
  )
}
