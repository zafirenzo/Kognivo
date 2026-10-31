import Link from 'next/link'
import type { Metadata } from 'next'
import { PRODUCTS, SHELVES, shelfOf } from '@/lib/catalogue'
import { RisoText } from '@/components/Riso'
import { DealIn } from '@/components/motion/DealIn'
import { ProductCard } from '@/components/Catalogue'
import { TINT } from '@/components/Chrome'

export const metadata: Metadata = {
  title: 'Store',
  description: 'Software to buy once or by the month, free and open-source tools, hardware, projects and instruments still under cloth.',
}

export default async function Store({ searchParams }: { searchParams: Promise<{ shelf?: string }> }) {
  const { shelf } = await searchParams
  const active = SHELVES.find((s) => s.id === shelf)
  const items = active ? PRODUCTS.filter((x) => shelfOf(x) === active.id) : PRODUCTS
  return (
    <section className="section store">
      <div className="wrap">
        <div className="store-head">
          <RisoText as="h1" key={active?.id ?? 'all'} text={active ? `${active.name}.` : 'The shop.'} className="page-title" />
          <p className="lede">{active ? active.line : 'Everything we make: to buy once, by the month, for free, to build on, to plug in, or to reserve before it is finished.'}</p>
        </div>
        <nav className="shelves" aria-label="Shelves">
          <Link href="/store" aria-current={!active ? 'page' : undefined}>
            Everything <span>{PRODUCTS.length}</span>
          </Link>
          {SHELVES.map((s) => (
            <Link key={s.id} href={`/store?shelf=${s.id}`} className={`ink-${TINT[s.id]}`} aria-current={active?.id === s.id ? 'page' : undefined}>
              {s.name} <span>{PRODUCTS.filter((x) => shelfOf(x) === s.id).length}</span>
            </Link>
          ))}
        </nav>
        {items.length ? (
          <DealIn key={active?.id ?? 'all'} className="store-grid">
            {items.map((x, i) => (
              <ProductCard key={x.slug} x={x} eager={i < 4} i={i} />
            ))}
          </DealIn>
        ) : (
          <p className="lede empty">Nothing on this shelf yet. <Link href="/store" className="link">See everything</Link></p>
        )}
      </div>
    </section>
  )
}
