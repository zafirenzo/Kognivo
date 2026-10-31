import Link from 'next/link'
import type { Metadata } from 'next'
import { getOrderPublic } from '@/lib/db'
import { getInstrument, plateTitle, rupees } from '@/lib/catalogue'
import { PREORDER_RULE } from '@/lib/site'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Thanks({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const o = await getOrderPublic((await searchParams).order ?? '')
  const x = o && getInstrument(o.instrument)
  const paid = o?.status === 'paid'
  return (
    <section className="section">
      <div className="wrap narrow">
        <h1 className="inst-title">{paid ? 'Thank you.' : 'Payment received.'}</h1>
        {o && x ? (
          <>
            <p className="lede">
              {o.kind === 'plan' ? `${x.name}, ${x.plans?.find((p) => p.id === o.plan)?.name} plan` : `Early access to ${plateTitle(x)}`}, {rupees(o.amount_paise / 100)}.
            </p>
            <p>{paid ? 'Your receipt is on its way to your email.' : 'The bank is confirming it. Your receipt arrives by email the moment it does; you can close this page.'}</p>
            {o.kind === 'preorder' && <p className="mute">{PREORDER_RULE.what} {PREORDER_RULE.refund}</p>}
          </>
        ) : (
          <p className="lede">Your receipt arrives by email once the bank confirms the payment.</p>
        )}
        <Link href="/" className="link">Back to the cabinet</Link>
      </div>
    </section>
  )
}
