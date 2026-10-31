import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getInstrument, plateTitle, rupees, PREORDER_PRICE } from '@/lib/catalogue'
import { PREORDER_RULE } from '@/lib/site'
import { CheckoutForm } from '@/components/CheckoutForm'
import { Stamp } from '@/components/Chrome'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default async function Checkout({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ plan?: string }> }) {
  const x = getInstrument((await params).slug)
  if (!x) notFound()
  if (x.state === 'beta') redirect(`/instruments/${x.slug}`)
  const { plan: planId } = await searchParams
  const plan = x.state === 'live' ? x.plans?.find((p) => p.id === planId) : undefined
  if (x.state === 'live' && !plan) redirect(`/instruments/${x.slug}`)

  const what = plan ? `${x.name}, ${plan.name} plan` : `Early access to ${plateTitle(x)}`
  const price = rupees(plan ? plan.price : PREORDER_PRICE)
  const rule = plan
    ? `I understand this is billed monthly and I can cancel before the next month begins. I have read the terms.`
    : `I understand this reserves early access to an instrument still in development. ${PREORDER_RULE.refund}`

  return (
    <section className="section">
      <div className="wrap checkout">
        <aside className="checkout-sum">
          <img src={`/plates/${x.plate}.webp`} alt="" width={960} height={1200} />
          <div>
            <Stamp state={x.state} />
            <h1 className="h2">{what}</h1>
            <p className="price">{price}{plan && <span> a month</span>}</p>
            <p className="mute">{plan ? 'Your workspace opens as soon as the bank confirms.' : PREORDER_RULE.what}</p>
            <Link href="/terms" className="link">Terms and refunds</Link>
          </div>
        </aside>
        <CheckoutForm instrument={x.slug} plan={plan?.id} what={what} price={price} rule={rule} />
      </div>
    </section>
  )
}
