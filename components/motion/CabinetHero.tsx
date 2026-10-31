'use client'
import { motion, useMotionTemplate, useScroll, useTransform } from 'motion/react'
import { useRef, useSyncExternalStore, type ReactNode } from 'react'
import { useMediaQuery, useReduced, EASE } from './hooks'

const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false)

/**
 * The cabinet opens. Desktop: the section pins for a screen and scrolling swings the two
 * engraved doors open on their hinges, the interior shadow lifts and Plate I settles into
 * place. Phones: the doors open once the cabinet scrolls into view. Reduced motion: the
 * cabinet is already open. The copy and the beta form never move, so the action works from
 * the first frame.
 */
export function CabinetHero({ children, caption }: { children: ReactNode; caption: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  const mounted = useMounted()
  const reduce = useReduced()
  const desktop = useMediaQuery('(min-width: 900px)')
  // Until the client knows the screen, the doors stay shut and nothing animates.
  const mode = !mounted ? 'still' : reduce ? 'open' : desktop ? 'pinned' : 'reveal'
  const pinned = mode === 'pinned'
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useTransform(scrollYProgress, (v) => v)

  const left = useTransform(p, [0.04, 0.6], [0, -84])
  const right = useTransform(p, [0.04, 0.6], [0, 84])
  const shade = useTransform(p, [0.04, 0.6], [1, 0.62])
  const doorFilter = useMotionTemplate`brightness(${shade})`
  const veil = useTransform(p, [0.05, 0.55], [0.72, 0])
  const plateScale = useTransform(p, [0.1, 0.85], [1.1, 1])
  const capOpacity = useTransform(p, [0.5, 0.7], [0, 1])
  const capY = useTransform(p, [0.5, 0.7], [12, 0])

  const swing = { duration: 1.6, delay: 0.3, ease: EASE }
  const inView = { once: true, amount: 0.5 } as const

  return (
    <section ref={ref} className={`cabinet-hero ${pinned ? 'is-pinned' : ''}`}>
      <div className="cabinet-stage">
        <div className="wrap hero-grid">
          <div className="hero-copy">{children}</div>
          <div className="cabinet">
            <div className="cabinet-body">
              <div className="cabinet-window">
                <motion.img
                  src="/plates/armillary.webp"
                  alt="Engraving of an armillary sphere on a turned stand: Plate I, OmniReach."
                  width={1200}
                  height={1500}
                  fetchPriority="high"
                  className="cabinet-plate"
                  style={pinned ? { scale: plateScale } : undefined}
                />
              </div>
              <motion.div
                aria-hidden
                className="cabinet-veil"
                style={pinned ? { opacity: veil } : { opacity: mode === 'open' ? 0 : 0.72 }}
                whileInView={mode === 'reveal' ? { opacity: 0 } : undefined}
                viewport={inView}
                transition={{ ...swing, duration: 1.4 }}
              />
              {(['left', 'right'] as const).map((side) => {
                const open = side === 'left' ? -84 : 84
                return (
                  <motion.img
                    key={side}
                    aria-hidden
                    src={`/plates/door-${side}.webp`}
                    alt=""
                    width={640}
                    height={1520}
                    className={`door door-${side}`}
                    style={pinned ? { rotateY: side === 'left' ? left : right, filter: doorFilter } : { rotateY: mode === 'open' ? open : 0 }}
                    whileInView={mode === 'reveal' ? { rotateY: open } : undefined}
                    viewport={inView}
                    transition={swing}
                  />
                )
              })}
            </div>
            <motion.p className="cabinet-cap" style={pinned ? { opacity: capOpacity, y: capY } : undefined}>
              {caption}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  )
}
