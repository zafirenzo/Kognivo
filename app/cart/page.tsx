import type { Metadata } from 'next'
import { CartView } from '@/components/Shop'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

export default function CartPage() {
  return (
    <section className="section">
      <div className="wrap">
        <h1 className="inst-title cart-title">Your cart.</h1>
        <CartView />
      </div>
    </section>
  )
}
