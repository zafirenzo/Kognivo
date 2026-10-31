import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { RisoText, Scribble, PosterPile } from '@/components/Riso'
import { DealIn } from '@/components/motion/DealIn'
import { LabGallery } from '@/components/motion/LabGallery'
import { InlinePlateHeadline } from '@/components/motion/InlinePlateHeadline'
import { CitedLetter } from '@/components/CitedLetter'
import { ProductCard } from '@/components/Catalogue'
import { TINT } from '@/components/Chrome'
import { PRODUCTS, SHELVES, PREORDER_PRICE, getProduct, priceLabel, rupees, shelfOf } from '@/lib/catalogue'

const pile = (slug: string, tint: string) => {
  const x = getProduct(slug)!
  return { src: `/prints/${x.plate}.webp`, href: `/store/${x.slug}`, label: `Riso print of ${x.name}`, price: priceLabel(x).replace(' a month', '/mo'), tint }
}

export default function Home() {
  const fresh = PRODUCTS.filter((x) => x.status === 'available')
  const soon = PRODUCTS.filter((x) => x.status === 'soon')
  const ticker = [...fresh, getProduct('omnireach')!].map((x) => `${x.name} ${priceLabel(x).replace(' a month', '/mo')}`)
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <RisoText as="h1" text="Things we make." className="hero-title" />
            <p className="lede">Software to buy once or by the month, free and open-source tools, hardware we build and ship, and projects to take home. Made by hand in Raipur.</p>
            <div className="hero-actions">
              <Link href="/store" className="btn">Shop everything <ArrowRight size={18} weight="bold" aria-hidden /></Link>
              <Link href="/commission" className="link">Commission a build</Link>
            </div>
          </div>
          <div className="hero-art">
            <PosterPile items={[pile('macropad', 'orange'), pile('hourglass', 'yellow'), pile('omnireach', 'pink')]} />
            <Scribble arrow="down-left" className="hero-note">fresh this week!</Scribble>
          </div>
        </div>
      </section>

      <div className="ticker" aria-label="On sale now">
        <div className="ticker-track">
          {[0, 1].map((k) => (
            <p key={k} aria-hidden={k === 1}>
              {ticker.map((t) => (
                <span key={t}>{t}<svg viewBox="0 0 20 20" aria-hidden><path d="M10 1v18M1 10h18M3.6 3.6l12.8 12.8M16.4 3.6 3.6 16.4" /></svg></span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <section id="shelves" className="section">
        <div className="wrap">
          <div className="section-head">
            <RisoText text="Pick a shelf." className="h2" />
            <Scribble arrow="down" className="head-note">everything fits in one cart</Scribble>
          </div>
          <DealIn className="shelf-wall">
            {SHELVES.filter((s) => s.id !== 'soon').map((s, i) => (
              <Link key={s.id} href={`/store?shelf=${s.id}`} className={`shelf tilt-${i % 4}`}>
                <span className="poster">
                  <img src={`/prints/${s.plate}.webp`} alt="" width={900} height={1125} loading="lazy" decoding="async" />
                </span>
                <span className={`shelf-label ink-${TINT[s.id]}`}>
                  <b>{s.name}</b>
                  <span>{s.line}</span>
                  <i>{PRODUCTS.filter((x) => shelfOf(x) === s.id).length}</i>
                </span>
              </Link>
            ))}
          </DealIn>
        </div>
      </section>

      <LabGallery
        id="fresh"
        heading={
          <div className="lab-head">
            <RisoText text="Fresh off the drum." className="h2" />
            <p className="lede">Everything you can take home today. Add as many as you like; there is one cart for software, hardware and the rest.</p>
          </div>
        }
      >
        {fresh.map((x, i) => (
          <div key={x.slug} className="lab-card">
            <ProductCard x={x} i={i} />
          </div>
        ))}
      </LabGallery>

      <section className="section evidence">
        <div className="wrap evidence-grid">
          <div className="evidence-copy">
            <RisoText text="Every sentence has a source." className="h2" />
            <p className="lede">Our first instrument, OmniReach, writes cold outreach from a prospect&apos;s real pages, keeps only what it can quote back, and shows you the evidence before anything is sent.</p>
            <Link href="/store/omnireach" className="btn">Join the private beta <ArrowRight size={18} weight="bold" aria-hidden /></Link>
            <Scribble arrow="right" className="evidence-note">tap the little numbers</Scribble>
          </div>
          <CitedLetter />
        </div>
      </section>

      <section className="section proofs">
        <div className="wrap">
          <div className="section-head">
            <RisoText text="Still on the press." className="h2" />
            <p className="lede">{soon.length} more instruments are being made. These are one-ink proofs. Reserve early access to any of them for {rupees(PREORDER_PRICE)} and it opens to you first.</p>
          </div>
          <DealIn className="proof-grid">
            {soon.map((x, i) => (
              <ProductCard key={x.slug} x={x} i={i} />
            ))}
          </DealIn>
        </div>
      </section>

      <section className="section commission">
        <div className="wrap commission-grid">
          <InlinePlateHeadline label="Have one made for you." lines={[['Have one', { src: '/prints/dividers.webp', pos: '50% 55%' }], ['made for you.']]} />
          <div className="commission-copy">
            <p className="lede">We build custom software and hardware for companies, schools and founders: tools, automations, apps and devices, made the same way.</p>
            <Link href="/commission" className="btn">Commission a build <ArrowRight size={18} weight="bold" aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
