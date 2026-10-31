'use client'
import { useSyncExternalStore } from 'react'
import { lineId, type Line } from './catalogue'

// The cart lives in this browser only (localStorage), with an in-memory fallback when storage
// is blocked. Prices are never stored here: the catalogue prices every render, the server
// prices again before charging.
const KEY = 'kognivo-cart'
const EMPTY: Line[] = []
let mem: string | null = null
let cache: { raw: string | null; lines: Line[] } = { raw: null, lines: EMPTY }
const listeners = new Set<() => void>()

function raw() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return mem
  }
}

function read(): Line[] {
  const r = raw()
  if (r === cache.raw) return cache.lines
  let lines = EMPTY
  try {
    const v = JSON.parse(r ?? '[]')
    if (Array.isArray(v)) lines = v.filter((l) => l && typeof l.slug === 'string' && Number.isFinite(l.qty))
  } catch {}
  cache = { raw: r, lines }
  return lines
}

function write(lines: Line[]) {
  const r = JSON.stringify(lines)
  mem = r
  try {
    localStorage.setItem(KEY, r)
  } catch {}
  listeners.forEach((f) => f())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

export const useCart = () => useSyncExternalStore(subscribe, read, () => EMPTY)

export const cart = {
  add(slug: string, option: string | undefined, qty = 1) {
    const lines = read()
    const id = lineId({ slug, option })
    const hit = lines.find((l) => lineId(l) === id)
    write(hit ? lines.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l)) : [...lines, { slug, option, qty }])
  },
  setQty(id: string, qty: number) {
    write(read().map((l) => (lineId(l) === id ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l)))
  },
  remove(id: string) {
    write(read().filter((l) => lineId(l) !== id))
  },
  clear() {
    write([])
  },
}
