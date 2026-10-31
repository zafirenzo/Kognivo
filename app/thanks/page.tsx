import Link from 'next/link'
import type { Metadata } from 'next'
import { getOrderPublic } from '@/lib/db'
import { rupees } from '@/lib/catalogue'

export const metadata: Metadata = { title: 'Thank you', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function Thanks({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const o = await getOrderPublic((await searchParams).order ?? '')
  const paid = o?.status === 'paid'
  return (
    <section className="section">
      <div className="wrap narrow">
        <h1 className="inst-title">{paid ? 'Thank you.' : 'Payment received.'}</h1>
        {o ? (
          <>
            <ul className="thanks-items">
              {o.items.map((i) => (
                <li key={i.slug + i.option}>
                  {i.status === 'soon' ? 'Early access: ' : ''}{i.name}{i.option ? `, ${i.option}` : ''}{i.qty > 1 ? ` × ${i.qty}` : ''}
                </li>
              ))}
            </ul>
            <p className="lede">{rupees(o.amount_paise / 100)}, order {o.id.slice(0, 8).toUpperCase()}.</p>
            <p>{paid ? 'Your receipt is on its way to your email, with what happens next.' : 'The bank is confirming it. Your receipt arrives by email the moment it does; you can close this page.'}</p>
          </>
        ) : (
          <p className="lede">Your receipt arrives by email once the bank confirms the payment.</p>
        )}
        <Link href="/store" className="link">Back to the store</Link>
      </div>
    </section>
  )
}
