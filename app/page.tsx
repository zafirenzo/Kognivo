import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { CabinetHero } from '@/components/motion/CabinetHero'
import { SplitText } from '@/components/motion/SplitText'
import { DealIn } from '@/components/motion/DealIn'
import { LabGallery } from '@/components/motion/LabGallery'
import { InlinePlateHeadline } from '@/components/motion/InlinePlateHeadline'
import { CitedLetter } from '@/components/CitedLetter'
import { Ledger } from '@/components/Catalogue'
import { PRODUCTS, SHELVES, PREORDER_PRICE, getProduct, plateNo, rupees, shelfOf } from '@/lib/catalogue'

const COUNTER = ['macropad', 'hourglass', 'metronome', 'orrery', 'padlock'].map((s) => getProduct(s)!)

export default function Home() {
  const soon = PRODUCTS.filter((x) => x.status === 'soon')
  return (
    <>
      <CabinetHero caption={<><b>Pl. I</b> OmniReach, in private beta.</>}>
        <SplitText as="h1" text="A shop of instruments." className="hero-title" />
        <p className="lede">Software to buy once or by the month, free and open-source tools, hardware we build and ship, and our own projects. All made by Kognivo.</p>
        <div className="hero-actions">
          <Link href="/store" className="btn">Browse the store <ArrowRight size={18} aria-hidden /></Link>
          <Link href="/commission" className="link">Commission a build <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </CabinetHero>

      <section id="shelves" className="section">
        <div className="wrap">
          <SplitText as="h2" text="Six shelves, one cart." className="h2" />
          <DealIn className="shelf-grid">
            {SHELVES.filter((s) => s.id !== 'soon').map((s) => (
              <Link key={s.id} href={`/store?shelf=${s.id}`} className="drawer">
                <span className="plate-frame">
                  <img src={`/plates/${s.plate}.webp`} alt="" width={960} height={1200} loading="lazy" decoding="async" />
                </span>
                <span className="drawer-label">
                  <span className="drawer-name">{s.name}</span>
                  <span className="drawer-line">{s.line}</span>
                  <span className="drawer-count">{PRODUCTS.filter((x) => shelfOf(x) === s.id).length}</span>
                </span>
              </Link>
            ))}
          </DealIn>
        </div>
      </section>

      <section className="section counter">
        <div className="wrap">
          <SplitText as="h2" text="On the counter." className="h2" />
          <Ledger items={COUNTER} />
          <p className="after-steps">
            <Link href="/store" className="link">See everything in the store <ArrowRight size={16} aria-hidden /></Link>
          </p>
        </div>
      </section>

      <section className="section evidence">
        <div className="wrap evidence-grid">
          <div className="evidence-copy">
            <SplitText as="h2" text="Every sentence has a source." className="h2" />
            <p className="lede">Our first instrument, OmniReach, writes cold outreach from a prospect&apos;s real pages, keeps only what it can quote back, and shows you the evidence before anything is sent.</p>
            <Link href="/store/omnireach" className="link">Join the private beta <ArrowRight size={16} aria-hidden /></Link>
            <img className="evidence-plate" src="/plates/magnifier.webp" alt="Engraving of a reading glass held over a letter." width={1500} height={1200} loading="lazy" decoding="async" />
          </div>
          <CitedLetter />
        </div>
      </section>

      <LabGallery
        heading={
          <div className="lab-head">
            <SplitText as="h2" text="Under cloth." className="h2" />
            <p className="lede">{soon.length} more instruments are on the bench. Reserve early access to any of them for {rupees(PREORDER_PRICE)}, and it opens to you first.</p>
          </div>
        }
      >
        {soon.map((x) => (
          <Link key={x.slug} href={`/store/${x.slug}`} className="lab-card">
            <span className="plate-frame">
              <img src={`/plates/${x.plate}.webp`} alt="" width={960} height={1200} loading="lazy" decoding="async" />
            </span>
            <span className="plate-cap">
              <span className="plate-no">{plateNo(x)}</span>
              <span className="plate-name">{x.name}</span>
            </span>
            <span className="lab-line">{x.line}</span>
            <span className="link">Reserve early access <ArrowRight size={16} aria-hidden /></span>
          </Link>
        ))}
      </LabGallery>

      <section className="section commission">
        <div className="wrap commission-grid">
          <InlinePlateHeadline label="Have one made for you." lines={[['Have one', { src: '/plates/dividers.webp', pos: '50% 58%' }], ['made for you.']]} />
          <div className="commission-copy">
            <p className="lede">We build custom software and hardware for companies, schools and founders: tools, automations, apps and devices, made the same careful way.</p>
            <Link href="/commission" className="btn">Commission a build <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
