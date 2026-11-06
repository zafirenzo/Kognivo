'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { animate, motion } from 'motion/react'
import { ArrowRight, X } from '@phosphor-icons/react/dist/ssr'
import { PRODUCTS, getProduct, plateNo, priceLabel, prints, type Product } from '@/lib/catalogue'
import { Stamp, tintOf } from '../Chrome'
import { useReduced, EASE } from '../motion/hooks'
import { wipeTo } from '../PageWipe'
import { useRouter } from 'next/navigation'

/**
 * Pull the lever: three reels of prints spin and stop, one after another, on the product you picked.
 * Then its ticket prints out underneath. The ticket is the way in: click it for the full product page.
 */

const REELS = 3
const STRIP = 16 // prints per reel before the one it lands on
const ALL = PRODUCTS.flatMap((x) => prints(x).slice(0, 2))

function strip(x: Product, k: number, seed: number) {
  const out: string[] = []
  for (let i = 0; i < STRIP; i++) out.push(ALL[Math.abs(Math.floor(Math.sin(seed * 31 + k * 97 + i * 13.7) * 1e4)) % ALL.length])
  const own = prints(x)
  out.push(own[k % own.length])
  return out
}

export function SlotMachine({ slug, onClose }: { slug: string | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [spin, setSpin] = useState(0)
  const [landed, setLanded] = useState(false)
  const reduce = useReduced()
  const router = useRouter()
  const x = current ? getProduct(current) : undefined

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (slug) {
      setCurrent(slug)
      setSpin((s) => s + 1)
      if (!d.open) d.showModal()
    } else if (d.open) d.close()
  }, [slug])

  const strips = useMemo(() => (x ? Array.from({ length: REELS }, (_, k) => strip(x, k, spin)) : []), [x, spin])

  const again = () => {
    const pool = PRODUCTS.filter((p) => p.slug !== current)
    setCurrent(pool[Math.floor(Math.random() * pool.length)].slug)
    setSpin((s) => s + 1)
  }

  const go = () => {
    if (!x) return
    onClose()
    wipeTo(router, `/store/${x.slug}`, x.name, tintOf(x))
  }

  return (
    <dialog ref={dialog} className="slot" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()} aria-label={x ? `${x.name}, pulled from the machine` : 'Product machine'}>
      {x && (
        <div className={`slot-body ink-${tintOf(x)}`}>
          <button type="button" className="slot-close" onClick={onClose} aria-label="Close">
            <X size={20} weight="bold" />
          </button>
          <div className="slot-cabinet">
            <p className="slot-top" aria-hidden>
              <span>Kognivo</span>
              <span>{plateNo(x)}</span>
              <span>Three prints, one product</span>
            </p>
            <div className="slot-window">
              {strips.map((s, k) => (
                <Reel key={`${spin}-${k}`} srcs={s} k={k} still={reduce} onStop={k === REELS - 1 ? () => setLanded(true) : undefined} onStart={k === 0 ? () => setLanded(false) : undefined} />
              ))}
              <span className="slot-payline" aria-hidden />
            </div>
            <Lever key={spin} still={reduce} />
          </div>
          <motion.button
            key={`t-${spin}`}
            type="button"
            className="slot-ticket"
            onClick={go}
            initial={reduce ? false : { y: -40, opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={landed || reduce ? { y: 0, opacity: 1, clipPath: 'inset(0 0 0% 0)' } : undefined}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <span className="slot-ticket-head">
              <Stamp x={x} />
              <span className="slot-price">{priceLabel(x)}</span>
            </span>
            <b className="slot-name">{x.name}</b>
            <span className="slot-line">{x.line}</span>
            <span className="slot-go">
              See {x.name} <ArrowRight size={18} weight="bold" aria-hidden />
            </span>
          </motion.button>
          <button type="button" className="slot-again link" onClick={again} disabled={!landed && !reduce}>
            Pull again for something else
          </button>
          <p className="sr-only" aria-live="polite">{landed || reduce ? `${x.name}. ${x.line} ${priceLabel(x)}.` : ''}</p>
        </div>
      )}
    </dialog>
  )
}

function Reel({ srcs, k, still, onStop, onStart }: { srcs: string[]; k: number; still: boolean; onStop?: () => void; onStart?: () => void }) {
  const track = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = track.current
    if (!el) return
    const end = `-${((srcs.length - 1) / srcs.length) * 100}%`
    if (still) {
      el.style.transform = `translateY(${end})`
      onStop?.()
      return
    }
    onStart?.()
    el.style.transform = 'translateY(0%)'
    // a fast blur of a spin, then a heavy stop with a small kick back, each reel later than the last
    const a = animate(el, { y: ['0%', end] }, { duration: 1.25 + k * 0.45, ease: [0.2, 0.0, 0.15, 1.08], delay: 0.15 })
    a.then(() => onStop?.())
    return () => a.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcs, still])
  return (
    <div className="reel">
      <div ref={track} className="reel-track">
        {srcs.map((src, i) => (
          <img key={i} src={src} alt="" width={900} height={1125} decoding="async" />
        ))}
      </div>
    </div>
  )
}

function Lever({ still }: { still: boolean }) {
  return (
    <motion.span
      className="slot-lever"
      aria-hidden
      initial={still ? false : { rotate: 0 }}
      animate={still ? undefined : { rotate: [0, 58, 0] }}
      transition={{ duration: 0.7, times: [0, 0.35, 1], ease: 'easeInOut' }}
    >
      <i />
    </motion.span>
  )
}
