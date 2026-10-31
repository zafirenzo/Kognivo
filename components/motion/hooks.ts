'use client'
import { useSyncExternalStore } from 'react'

/** Hydration-safe media query: false on the server and first paint, then live. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', cb)
      return () => mq.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const useReduced = () => useMediaQuery('(prefers-reduced-motion: reduce)')

export const EASE = [0.16, 1, 0.3, 1] as const
