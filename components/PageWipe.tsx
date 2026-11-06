'use client'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import type { useRouter } from 'next/navigation'

/**
 * A sheet of coloured stock with a curved edge sweeps up over the page, carrying the name of where
 * you are going, the route changes underneath it, and it carries on up and off. Mounted once in the layout.
 */

type Wipe = { label: string; tint: string; phase: 'in' | 'hold' | 'out' | 'idle' }
let state: Wipe = { label: '', tint: 'pink', phase: 'idle' }
const subs = new Set<() => void>()
const set = (s: Partial<Wipe>) => {
  state = { ...state, ...s }
  subs.forEach((f) => f())
}

const IN_MS = 620

export function wipeTo(router: ReturnType<typeof useRouter>, href: string, label: string, tint = 'pink') {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return router.push(href)
  router.prefetch(href)
  set({ label, tint, phase: 'in' })
  setTimeout(() => {
    set({ phase: 'hold' })
    router.push(href)
  }, IN_MS)
}

export function PageWipe() {
  const s = useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
    () => state,
  )
  const path = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) return void (first.current = false)
    if (state.phase === 'hold' || state.phase === 'in') {
      scrollTo(0, 0)
      requestAnimationFrame(() => set({ phase: 'out' }))
      setTimeout(() => set({ phase: 'idle' }), 900)
    }
  }, [path])
  return (
    <div className={`wipe ink-${s.tint}`} data-phase={s.phase} aria-hidden>
      <span>{s.label}</span>
    </div>
  )
}
