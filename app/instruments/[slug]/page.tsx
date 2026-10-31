import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react/dist/ssr'
import { INSTRUMENTS, getInstrument, plateTitle, rupees, PREORDER_PRICE } from '@/lib/catalogue'
import { PREORDER_RULE } from '@/lib/site'
import { SplitText } from '@/components/motion/SplitText'
import { WaitlistForm } from '@/components/Forms'
import { Stamp } from '@/components/Chrome'

export const generateStaticParams = () => INSTRUMENTS.map((x) => ({ slug: x.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = getInstrument((await params).slug)
  if (!x) return {}
  return { title: x.n === 1 ? x.name : `${plateTitle(x)}, in the lab`, description: x.line, openGraph: { images: [`/plates/${x.plate}.webp`] } }
}

export default async function InstrumentPage({ params }: { params: Promise<{ slug: string }> }) {
  const x = getInstrument((await params).slug)
  if (!x) notFound()
  const i = INSTRUMENTS.indexOf(x)
  const prev = INSTRUMENTS[(i + INSTRUMENTS.length - 1) % INSTRUMENTS.length]
  const next = INSTRUMENTS[(i + 1) % INSTRUMENTS.length]

  return (
    <>
      <section className="section inst">
        <div className="wrap inst-grid">
          <figure className="inst-plate">
            <img src={`/plates/${x.plate}.webp`} alt={x.n === 1 ? 'Engraving of an armillary sphere on a turned stand.' : 'Engraving of an instrument hidden under a draped cloth.'} width={1200} height={1500} fetchPriority="high" />
            <figcaption><b>{plateTitle(x)}</b> {x.n === 1 ? 'An armillary sphere, for reach.' : 'Under cloth until it is ready.'}</figcaption>
          </figure>
          <div className="inst-copy">
            <Stamp state={x.state} />
            <SplitText as="h1" text={x.name} className="inst-title" />
            <p className="lede">{x.line}</p>
            {x.for && <p className="mute">For {x.for.charAt(0).toLowerCase() + x.for.slice(1)}</p>}

            {x.state === 'beta' && (
              <div className="inst-action">
                <p>The private beta opens in small groups. Leave your email and we will write when your seat is ready.</p>
                <WaitlistForm instrument={x.slug} id="inst" />
              </div>
            )}
            {x.state === 'lab' && (
              <div className="inst-action">
                <p className="price">{rupees(PREORDER_PRICE)} <span>early access</span></p>
                <p>{PREORDER_RULE.what}</p>
                <p className="mute">{PREORDER_RULE.refund}</p>
                <Link href={`/checkout/${x.slug}`} className="btn">Reserve early access <ArrowRight size={18} aria-hidden /></Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {x.features && (
        <section className="section features">
          <div className="wrap">
            <SplitText as="h2" text="What it does, exactly." className="h2" />
            <div className="feature-cols">
              {x.features.map((g) => (
                <div key={g.group}>
                  <h3>{g.group}</h3>
                  <ul>
                    {g.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {x.plans && (
        <section className="section plans">
          <div className="wrap">
            <SplitText as="h2" text={x.state === 'live' ? 'Plans.' : 'Plans, when the beta ends.'} className="h2" />
            <p className="lede">Monthly, in rupees, with a 14-day trial. Beta members keep their seat when plans open. Prices may change before launch.</p>
            <div className="ledger">
              {x.plans.map((p) => (
                <div key={p.id} className="ledger-col">
                  <h3>{p.name}</h3>
                  <p className="price">{rupees(p.price)} <span>a month</span></p>
                  <ul>
                    {p.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  {x.state === 'live' ? (
                    <Link href={`/checkout/${x.slug}?plan=${p.id}`} className="btn">Choose {p.name} <ArrowRight size={18} aria-hidden /></Link>
                  ) : (
                    <Link href="#inst" className="link">Join the beta <ArrowRight size={16} aria-hidden /></Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <nav className="wrap inst-pager" aria-label="Other instruments">
        <Link href={`/instruments/${prev.slug}`} className="link"><ArrowLeft size={16} aria-hidden /> {plateTitle(prev)}, {prev.name}</Link>
        <Link href={`/instruments/${next.slug}`} className="link">{plateTitle(next)}, {next.name} <ArrowRight size={16} aria-hidden /></Link>
      </nav>
    </>
  )
}
