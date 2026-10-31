'use client'
import { motion, useScroll, useTransform } from 'motion/react'
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useMediaQuery, useReduced } from './hooks'

/**
 * The bench, walked past sideways. Desktop: the section pins and vertical scroll pans the
 * covered plates across. Phones and reduced motion: a native swipe row with scroll-snap.
 */
export function LabGallery({ heading, children, id = 'lab' }: { heading: ReactNode; children: ReactNode; id?: string }) {
  const desktop = useMediaQuery('(min-width: 900px)')
  const reduce = useReduced()
  const pinned = desktop && !reduce
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useTransform(scrollYProgress, (v) => v)
  const x = useTransform(p, [0.04, 0.96], [0, -distance])

  useLayoutEffect(() => {
    if (!pinned || !track.current) return
    const el = track.current
    const measure = () => setDistance(Math.max(el.scrollWidth - window.innerWidth, 0))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [pinned])

  if (!pinned) {
    return (
      <section id={id} className="lab">
        <div className="wrap">{heading}</div>
        <div className="lab-row">{children}</div>
      </section>
    )
  }
  return (
    <section id={id} ref={ref} className="lab is-pinned" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="lab-stage">
        <div className="wrap">{heading}</div>
        <motion.div ref={track} style={{ x }} className="lab-track">
          {children}
        </motion.div>
      </div>
    </section>
  )
}
