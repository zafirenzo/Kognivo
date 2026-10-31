import Link from 'next/link'
import { buyable, priceLabel, type Product } from '@/lib/catalogue'
import { Stamp, tintOf } from './Chrome'
import { QuickAdd } from './Shop'

/** One poster on the wall: the print, taped up, with its price sticker and the quickest action. */
export function ProductCard({ x, eager = false, i = 0 }: { x: Product; eager?: boolean; i?: number }) {
  const quick = buyable(x) && !x.options && x.status === 'available'
  return (
    <article className={`product tilt-${i % 4}`}>
      <Link href={`/store/${x.slug}`} className="poster">
        <img src={`/prints/${x.plate}.webp`} alt={`Riso print of ${x.name}`} width={900} height={1125} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        <span className={`sticker sticker-${tintOf(x)}`}>{priceLabel(x).replace(' a month', '/mo').replace(' early access', '')}</span>
        {x.sample && <span className="sample-tag">sample</span>}
      </Link>
      <div className="product-cap">
        <Link href={`/store/${x.slug}`} className="product-name">{x.name}</Link>
        <Stamp x={x} />
      </div>
      <p className="product-line">{x.line}</p>
      <div className="product-foot">
        {quick ? <QuickAdd slug={x.slug} /> : <Link href={`/store/${x.slug}`} className="link">{x.href ? x.hrefLabel : x.status === 'beta' ? 'Join the beta' : x.status === 'soon' ? 'Reserve' : 'Choose'}</Link>}
      </div>
    </article>
  )
}
