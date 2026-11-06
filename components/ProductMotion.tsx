'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { useReduced, EASE } from './motion/hooks'
import { wipeTo } from './PageWipe'

const GLYPHS = '#%&*+=?@ABCDEFGHKMNPRSTUVWXYZ0123456789'

/** A mono label that types itself out of noise when it comes into view, and again on hover. */
export function ScrambleText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [out, setOut] = useState(text)
  const reduce = useReduced()
  const run = useRef<() => void>(() => {})
  useEffect(() => {
    if (reduce) return
    let raf = 0
    run.current = () => {
      cancelAnimationFrame(raf)
      const t0 = performance.now()
      const tick = (now: number) => {
        const k = (now - t0) / 700
        setOut([...text].map((c, i) => (c === ' ' || i / text.length < k ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''))
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (run.current(), io.disconnect()))
    if (ref.current) io.observe(ref.current)
    return () => (io.disconnect(), cancelAnimationFrame(raf))
  }, [text, reduce])
  return (
    <span ref={ref} className={className} onPointerEnter={() => run.current()} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  )
}

/** The cover print, uncovered from the bottom on arrival, drifting slower than the page. */
export function HeroPrint({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
  return (
    <motion.div
      ref={ref}
      className="pp-hero-print"
      initial={reduce ? false : { clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: 'inset(0% 0 0 0)' }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
    >
      <motion.img src={src} alt={alt} width={1600} height={900} fetchPriority="high" style={reduce ? undefined : { y, scale }} />
    </motion.div>
  )
}

/** The other prints, staggered down the page at different sizes, each moving at its own speed. */
export function Gallery({ items }: { items: { src: string; alt: string; caption: string }[] }) {
  return (
    <div className="pp-gallery">
      {items.map((it, i) => (
        <GalleryItem key={it.src} {...it} i={i} />
      ))}
    </div>
  )
}

function GalleryItem({ src, alt, caption, i }: { src: string; alt: string; caption: string; i: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReduced()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const speed = [60, -40, 90][i % 3]
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])
  return (
    <motion.figure ref={ref} className={`pp-shot pp-shot-${i % 3}`} style={reduce ? undefined : { y }}>
      <motion.div
        className="pp-shot-img"
        initial={reduce ? false : { clipPath: 'inset(0 0 100% 0)' }}
        whileInView={{ clipPath: 'inset(0 0 0% 0)' }}
        viewport={{ once: true, margin: '-12% 0px' }}
        transition={{ duration: 1, ease: EASE }}
      >
        <img src={src} alt={alt} width={900} height={1125} loading="lazy" />
      </motion.div>
      <figcaption>{caption}</figcaption>
    </motion.figure>
  )
}

/** The next product, as a big link at the foot of the page. */
export function NextProduct({ slug, name, plate, line, tint }: { slug: string; name: string; plate: string; line: string; tint: string }) {
  const router = useRouter()
  return (
    <a
      href={`/store/${slug}`}
      className={`pp-next ink-${tint}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        wipeTo(router, `/store/${slug}`, name, tint)
      }}
    >
      <span className="pp-label">Next product</span>
      <span className="pp-next-name">{name}</span>
      <span className="pp-next-line">
        {line} <ArrowRight size={20} weight="bold" aria-hidden />
      </span>
      <img src={`/prints/${plate}-wide.webp`} alt="" width={1600} height={900} loading="lazy" />
    </a>
  )
}
