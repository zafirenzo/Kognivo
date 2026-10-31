import type { Metadata } from 'next'
import { SplitText } from '@/components/motion/SplitText'
import { CommissionForm } from '@/components/Forms'

export const metadata: Metadata = {
  title: 'Commission a build',
  description: 'Custom software and hardware for companies, schools and founders, built by Kognivo.',
}

const HOW = [
  { t: 'You send the brief', d: 'A few sentences on what it should do and who it is for.' },
  { t: 'We reply in three working days', d: 'With questions, or a short written plan and a fixed quote.' },
  { t: 'We build in the open', d: 'You see working software every week, not a status report.' },
]

export default function Commission() {
  return (
    <section className="section">
      <div className="wrap commission-page">
        <div>
          <SplitText as="h1" text="Commission a build." className="inst-title" />
          <p className="lede">Tell us what you need made. We build tools, automations, apps and devices for companies, schools and founders.</p>
          <img src="/plates/dividers.webp" alt="Engraving of a pair of drafting dividers standing on a sheet of paper." width={1200} height={1500} className="commission-plate" loading="lazy" />
          <ol className="how-list">
            {HOW.map((h) => (
              <li key={h.t}>
                <b>{h.t}</b>
                <span>{h.d}</span>
              </li>
            ))}
          </ol>
        </div>
        <CommissionForm />
      </div>
    </section>
  )
}
