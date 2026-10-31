import type { Metadata } from 'next'
import { CheckoutView } from '@/components/Shop'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="inst-title cart-title">Checkout.</h1>
        <CheckoutView />
      </div>
    </section>
  )
}
