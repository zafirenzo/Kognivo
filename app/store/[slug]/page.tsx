import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { PRODUCTS, getProduct, plateNo, priceLabel, buyable, rupees, prints, widePrint, KIND_LABEL } from '@/lib/catalogue'
import { DELIVERY } from '@/lib/site'
import { RisoText, Scribble } from '@/components/Riso'
import { CitedLetter } from '@/components/CitedLetter'
import { StepIndex } from '@/components/motion/StepIndex'
import { WaitlistForm } from '@/components/Forms'
import { AddToCart } from '@/components/Shop'
import { tintOf } from '@/components/Chrome'
import { HeroPrint, ScrambleText, Gallery, NextProduct } from '@/components/ProductMotion'

export const generateStaticParams = () => PRODUCTS.map((x) => ({ slug: x.slug }))

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const x = getProduct((await params).slug)
  if (!x) return {}
  return { title: x.name, description: x.line, openGraph: { images: [widePrint(x)] } }
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
  const next = PRODUCTS[(i + 1) % PRODUCTS.length]
  const delivery = x.status === 'soon' ? DELIVERY.preorder : x.kind === 'hardware' ? DELIVERY.hardware : x.kind === 'subscription' ? DELIVERY.subscription : x.kind === 'project' ? DELIVERY.project : x.kind === 'software' ? DELIVERY.digital : null

  const kind = x.status === 'soon' ? 'Coming soon' : KIND_LABEL[x.kind]
  const status = x.status === 'beta' ? 'Private beta' : x.status === 'soon' ? 'In development' : x.stock === 0 ? 'Sold out' : 'Available now'
  const shots = prints(x).slice(1).map((src, k) => ({
    src,
    alt: `Another print of ${x.name}.`,
    caption: x.status === 'soon' ? 'Proof, one ink' : ['Turned left, three inks', 'Turned right, three inks', 'From behind, three inks'][k],
  }))
  const highlights = x.includes ?? x.features?.flatMap((g) => g.items.slice(0, 1)) ?? x.specs?.map(([k, v]) => `${k}: ${v}`)

  return (
    <>
      <article className={`pp ink-${tintOf(x)}`}>
        <header className="pp-hero">
          <HeroPrint src={widePrint(x)} alt={`Riso print of ${x.name}.`} />
          <p className="pp-hero-meta">
            <span>{plateNo(x)}</span>
            <span>{kind}</span>
          </p>
          <p className="pp-hero-small">{x.name}, {x.line.toLowerCase().replace(/\.$/, '')}</p>
        </header>

        <div className="pp-title wrap">
          <h1>{x.name}</h1>
          <ScrambleText text={`(${status})`} className="pp-label pp-scramble" />
        </div>

        <section className="pp-info wrap" aria-label="About this product">
          <div className="pp-cell">
            <p className="pp-label">© 2026 Kognivo</p>
            <p>{kind}<br />{status}<br />{x.licence ?? (x.kind === 'hardware' ? 'Ships from Raipur' : 'Delivered by email')}</p>
          </div>
          {highlights && (
            <div className="pp-cell">
              <p className="pp-label">{x.includes ? 'In the box' : 'Features'}</p>
              <ul>{highlights.slice(0, 5).map((l) => <li key={l}>{l}</li>)}</ul>
            </div>
          )}
          <div className="pp-cell pp-desc">
            <p className="pp-label">Description</p>
            <p>{x.about?.[0] ?? x.line}</p>
          </div>
          <div className="pp-cell pp-buy" id="buy">
            <p className="pp-label">{x.status === 'beta' ? 'Join the beta' : 'Get it'}</p>
            <p className="price">{priceLabel(x)}</p>
            {x.sample && <p className="sample-banner">A sample listing, so it cannot be bought yet.</p>}
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
        </section>

        <Gallery items={shots} />

        {(x.about?.[1] || x.specs || x.licence) && (
          <section className="pp-blocks wrap">
            {x.about?.[1] && (
              <div className="pp-block">
                <p className="pp-label">Who it is for</p>
                <p className="pp-big">{x.about[1]}</p>
              </div>
            )}
            {(x.specs || x.licence) && (
              <div className="pp-block">
                <p className="pp-label">The details</p>
                <dl className="specs">
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
            )}
          </section>
        )}
      </article>

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
        <section className="pp-blocks wrap">
          <div className="pp-block">
            <div>
              <p className="pp-label">A real draft</p>
              <Scribble arrow="right" className="evidence-note">tap the little numbers</Scribble>
            </div>
            <CitedLetter />
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

      <NextProduct slug={next.slug} name={next.name} plate={next.plate} line={next.line} tint={tintOf(next)} />
    </>
  )
}
