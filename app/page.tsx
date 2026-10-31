import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { CabinetHero } from '@/components/motion/CabinetHero'
import { SplitText } from '@/components/motion/SplitText'
import { DealIn } from '@/components/motion/DealIn'
import { LabGallery } from '@/components/motion/LabGallery'
import { StepIndex } from '@/components/motion/StepIndex'
import { InlinePlateHeadline } from '@/components/motion/InlinePlateHeadline'
import { CitedLetter } from '@/components/CitedLetter'
import { WaitlistForm } from '@/components/Forms'
import { Stamp } from '@/components/Chrome'
import { INSTRUMENTS, PREORDER_PRICE, plateTitle, rupees } from '@/lib/catalogue'

const STEPS = [
  { title: 'Brief', desc: 'Describe the campaign once: the objective, the audience, the ask, the tone, the attachment and your sending limits.' },
  { title: 'Research', desc: 'OmniReach finds candidate organisations and reads their actual web pages.' },
  { title: 'Keep what can be cited', desc: 'Only facts it can quote back to a source are kept. Everything else is dropped, and the drop is recorded.' },
  { title: 'Draft', desc: 'Each lead is scored against the campaign, then written to from its own facts, in your tone.' },
  { title: 'Review', desc: 'You see every draft beside its evidence. Nothing leaves until you approve it.' },
  { title: 'Send, then stop', desc: 'Emails go out within your daily and hourly caps. A reply stops the follow-ups; a bounce or an opt-out goes to suppression.' },
] as const

export default function Home() {
  const [omni, ...lab] = INSTRUMENTS
  return (
    <>
      <CabinetHero caption={<><b>Pl. I</b> OmniReach, in private beta.</>}>
        <SplitText as="h1" text="Instruments for honest work." className="hero-title" />
        <p className="lede">Kognivo is a small software house. Our first instrument writes cold outreach from facts it can cite. Eight more are on the bench.</p>
        <div id="beta">
          <WaitlistForm id="hero" />
        </div>
        <Link href="/commission" className="link">Commission a build <ArrowRight size={16} aria-hidden /></Link>
      </CabinetHero>

      <section id="cabinet" className="section">
        <div className="wrap">
          <SplitText as="h2" text="Nine plates. One is out of its case." className="h2" />
          <DealIn className="cabinet-grid">
            {INSTRUMENTS.map((x) => (
              <Link key={x.slug} href={`/instruments/${x.slug}`} className="plate-card">
                <span className="plate-frame">
                  <img src={`/plates/${x.plate}.webp`} alt="" width={x.n === 1 ? 1200 : 960} height={x.n === 1 ? 1500 : 1200} loading={x.n === 1 ? 'eager' : 'lazy'} decoding="async" />
                </span>
                <span className="plate-cap">
                  <span className="plate-no">{plateTitle(x)}</span>
                  <span className="plate-name">{x.name}</span>
                  <Stamp state={x.state} />
                </span>
              </Link>
            ))}
          </DealIn>
        </div>
      </section>

      <section className="section evidence">
        <div className="wrap evidence-grid">
          <div className="evidence-copy">
            <SplitText as="h2" text="Every sentence has a source." className="h2" />
            <p className="lede">{omni.name} reads a prospect&apos;s real pages, keeps only what it can quote back, and shows you the evidence before anything is sent.</p>
            <img className="evidence-plate" src="/plates/magnifier.webp" alt="Engraving of a reading glass held over a letter." width={1500} height={1200} loading="lazy" decoding="async" />
          </div>
          <CitedLetter />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SplitText as="h2" text="From brief to sent, in the open." className="h2" />
          <StepIndex steps={STEPS} />
          <p className="after-steps">
            <Link href="/instruments/omnireach" className="link">See OmniReach and its plans <ArrowRight size={16} aria-hidden /></Link>
          </p>
        </div>
      </section>

      <LabGallery
        heading={
          <div className="lab-head">
            <SplitText as="h2" text="Under cloth." className="h2" />
            <p className="lede">Eight more instruments are on the bench. Reserve early access to any of them for {rupees(PREORDER_PRICE)}, and it opens to you first.</p>
          </div>
        }
      >
        {lab.map((x) => (
          <Link key={x.slug} href={`/instruments/${x.slug}`} className="lab-card">
            <span className="plate-frame">
              <img src={`/plates/${x.plate}.webp`} alt="" width={960} height={1200} loading="lazy" decoding="async" />
            </span>
            <span className="plate-cap">
              <span className="plate-no">{plateTitle(x)}</span>
              <span className="plate-name">{x.name}</span>
            </span>
            <span className="lab-line">{x.line}</span>
            <span className="link">Reserve early access <ArrowRight size={16} aria-hidden /></span>
          </Link>
        ))}
      </LabGallery>

      <section className="section commission">
        <div className="wrap commission-grid">
          <InlinePlateHeadline
            label="Have one made for you."
            lines={[["Have one", { src: '/plates/dividers.webp', pos: '50% 58%' }], ['made for you.']]}
          />
          <div className="commission-copy">
            <p className="lede">We build custom software for companies, schools and founders: tools, automations and apps, made the same careful way.</p>
            <Link href="/commission" className="btn">Commission a build <ArrowRight size={18} aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  )
}
