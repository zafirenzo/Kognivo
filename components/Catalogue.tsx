import Link from 'next/link'
import { buyable, plateNo, priceLabel, type Product } from '@/lib/catalogue'
import { Stamp } from './Chrome'
import { QuickAdd } from './Shop'

/** One plate in the store grid: the engraving, its number and name, what it costs, and the quickest action. */
export function ProductCard({ x, eager = false }: { x: Product; eager?: boolean }) {
  const quick = buyable(x) && !x.options && x.status === 'available'
  return (
    <article className="product">
      <Link href={`/store/${x.slug}`} className="plate-card">
        <span className="plate-frame">
          <img src={`/plates/${x.plate}.webp`} alt="" width={960} height={1200} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        </span>
        <span className="plate-cap">
          <span className="plate-no">{plateNo(x)}</span>
          <span className="plate-name">{x.name}</span>
          <Stamp x={x} />
        </span>
      </Link>
      <p className="product-line">{x.line}</p>
      <div className="product-foot">
        <span className="product-price">{priceLabel(x)}</span>
        {quick ? <QuickAdd slug={x.slug} /> : <Link href={`/store/${x.slug}`} className="link">{x.href ? x.hrefLabel : x.status === 'beta' ? 'Join the beta' : 'View'}</Link>}
      </div>
      {x.sample && <span className="sample-note">Sample listing</span>}
    </article>
  )
}

/** A catalogue ledger: one ruled row per product, for the counter on the home page. */
export function Ledger({ items }: { items: Product[] }) {
  return (
    <ol className="ledger-rows">
      {items.map((x) => (
        <li key={x.slug}>
          <Link href={`/store/${x.slug}`} className="ledger-thumb"><img src={`/plates/${x.plate}.webp`} alt="" width={96} height={120} loading="lazy" /></Link>
          <span className="plate-no">{plateNo(x)}</span>
          <Link href={`/store/${x.slug}`} className="ledger-name">{x.name}{x.sample && <small> sample</small>}</Link>
          <span className="ledger-line">{x.line}</span>
          <Stamp x={x} />
          <span className="product-price">{priceLabel(x)}</span>
          {buyable(x) && !x.options && x.status === 'available' ? <QuickAdd slug={x.slug} /> : <Link href={`/store/${x.slug}`} className="link">View</Link>}
        </li>
      ))}
    </ol>
  )
}
