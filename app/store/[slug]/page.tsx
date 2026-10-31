import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { PRODUCTS, getProduct, plateNo, priceLabel, buyable, rupees, KIND_LABEL } from '@/lib/catalogue'
import { DELIVERY } from '@/lib/site'
import { RisoText } from '@/components/Riso'
import { StepIndex } from '@/components/motion/StepIndex'
import { WaitlistForm } from '@/components/Forms'
import { AddToCart } from '@/components/Shop'
import { Stamp, tintOf } from '@/components/Chrome'

export const generateStaticParams = () => PRODUCTS.map((x) => ({ slug: x.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = getProduct((await params).slug)
  if (!x) return {}
  return { title: x.name, description: x.line, openGraph: { images: [`/prints/${x.plate}.webp`] } }
}

const OMNI_STEPS = [
  { title: 'Brief', desc: 'Describe the campaign once: the objective, the audience, the ask, the tone, the attachment and your sending limits.' },
  { title: 'Research', desc: 'OmniReach finds candidate organisations and reads their actual web pages.' },
  { title: 'Keep what can be cited', desc: 'Only facts it can quote back to a source are kept. Everything else is dropped, and the drop is recorded.' },
  { title: 'Draft', desc: 'Each lead is scored against the campaign, then written to from its own facts, in your tone.' },
  { title: 'Review', desc: 'You see every draft beside its evidence. Nothing leaves until you approve it.' },
  { title: 'Send, then stop', desc: 'Emails go out within your daily and hourly caps. A reply stops the follow-ups; a bounce or an opt-out goes to suppression.' },
] as const

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const x = getProduct((await params).slug)
  if (!x) notFound()
  const i = PRODUCTS.indexOf(x)
  const prev = PRODUCTS[(i + PRODUCTS.length - 1) % PRODUCTS.length]
  const next = PRODUCTS[(i + 1) % PRODUCTS.length]
  const delivery = x.status === 'soon' ? DELIVERY.preorder : x.kind === 'hardware' ? DELIVERY.hardware : x.kind === 'subscription' ? DELIVERY.subscription : x.kind === 'project' ? DELIVERY.project : x.kind === 'software' ? DELIVERY.digital : null

  return (
    <>
      <nav className="wrap crumbs" aria-label="Breadcrumb">
        <Link href="/store">Store</Link> <span aria-hidden>/</span> <Link href={`/store?shelf=${x.status === 'soon' ? 'soon' : x.kind}`}>{x.status === 'soon' ? 'Coming soon' : KIND_LABEL[x.kind]}</Link>
      </nav>
      <section className="section inst">
        <div className="wrap inst-grid">
          <figure className="inst-plate">
            <span className="poster tilt-1">
              <img src={`/prints/${x.plate}.webp`} alt={`Riso print of ${x.name}.`} width={900} height={1125} fetchPriority="high" />
              <span className={`sticker sticker-${tintOf(x)} big`}>{priceLabel(x).replace(' a month', '/mo').replace(' early access', '')}</span>
            </span>
            <figcaption>{x.status === 'soon' ? 'A one-ink proof. The full print comes when it ships.' : `${plateNo(x)}, printed in three inks.`}</figcaption>
          </figure>
          <div className="inst-copy">
            <Stamp x={x} />
            <RisoText as="h1" text={x.name} className="page-title" />
            <p className="lede">{x.line}</p>
            {x.sample && <p className="sample-banner">This is a sample listing, so it cannot be bought. Replace it in <code>lib/catalogue.ts</code>.</p>}
            <p className="price">{priceLabel(x)}</p>

            <div className="inst-action">
              {x.status === 'beta' && (
                <>
                  <p>The private beta opens in small groups. Leave your email and we will write when your seat is ready.</p>
                  <WaitlistForm instrument={x.slug} id="inst" />
                </>
              )}
              {x.stock === 0 && x.status === 'available' && (
                <>
                  <p>Sold out for now. Leave your email and we will write when the next batch is built.</p>
                  <WaitlistForm instrument={x.slug} id="inst" label="Notify me" />
                </>
              )}
              {buyable(x) && <AddToCart slug={x.slug} label={x.status === 'soon' ? 'Reserve early access' : x.kind === 'subscription' ? 'Subscribe' : 'Add to cart'} />}
              {x.href && (
                <a href={x.href} className="btn" target={x.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  {x.hrefLabel} <ArrowUpRight size={18} aria-hidden />
                </a>
              )}
              {x.stock != null && x.stock > 0 && <p className="note">{x.stock} in stock.</p>}
              {delivery && x.status !== 'beta' && <p className="note">{delivery}</p>}
            </div>
          </div>
        </div>
      </section>

      {(x.about || x.includes || x.specs || x.licence) && (
        <section className="section details">
          <div className="wrap details-grid">
            {x.about && (
              <div className="prose">
                {x.about.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            <dl className="specs">
              {x.includes && (
                <>
                  <dt>Includes</dt>
                  <dd>
                    <ul>{x.includes.map((l) => <li key={l}>{l}</li>)}</ul>
                  </dd>
                </>
              )}
              {x.specs?.map(([k, v]) => (
                <div key={k} className="spec">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
              {x.licence && (
                <div className="spec">
                  <dt>Licence</dt>
                  <dd>{x.licence}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>
      )}

      {x.features && (
        <section className="section features">
          <div className="wrap">
            <RisoText text="What it does, exactly." className="h2" />
            <div className="feature-cols">
              {x.features.map((g) => (
                <div key={g.group}>
                  <h3>{g.group}</h3>
                  <ul>{g.items.map((it) => <li key={it}>{it}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {x.slug === 'omnireach' && (
        <section className="section">
          <div className="wrap">
            <RisoText text="From brief to sent, in the open." className="h2" />
            <StepIndex steps={OMNI_STEPS} />
          </div>
        </section>
      )}

      {x.options && x.kind === 'subscription' && x.status === 'beta' && (
        <section className="section plans">
          <div className="wrap">
            <RisoText text="Plans, when the beta ends." className="h2" />
            <p className="lede">Monthly, in rupees, with a 14-day trial. Beta members keep their seat when plans open. Prices may change before launch.</p>
            <div className="ledger">
              {x.options.map((p) => (
                <div key={p.id} className="ledger-col">
                  <h3>{p.name}</h3>
                  <p className="price">{rupees(p.price)} <span>a month</span></p>
                  <ul>{p.lines?.map((l) => <li key={l}>{l}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <nav className="wrap inst-pager" aria-label="Other products">
        <Link href={`/store/${prev.slug}`} className="link"><ArrowLeft size={16} aria-hidden /> {plateNo(prev)}, {prev.name}</Link>
        <Link href={`/store/${next.slug}`} className="link">{plateNo(next)}, {next.name} <ArrowRight size={16} aria-hidden /></Link>
      </nav>
    </>
  )
}
