import type { Metadata } from 'next'
import { PREORDER_RULE, SELLER } from '@/lib/site'
import { rupees, PREORDER_PRICE } from '@/lib/catalogue'

export const metadata: Metadata = { title: 'Terms and refunds' }

// TODO(founder): a lawyer should read this page before the first real sale.
export default function Terms() {
  return (
    <section className="section">
      <article className="wrap narrow prose">
        <h1 className="inst-title">Terms and refunds</h1>
        <h2>Early access</h2>
        <p>Early access to an instrument in the lab costs {rupees(PREORDER_PRICE)}, paid once. {PREORDER_RULE.what}</p>
        <p>{PREORDER_RULE.refund} You can also ask for a refund at any time before it opens, by writing to {SELLER.email}.</p>
        <h2>Plans</h2>
        <p>Plans are billed monthly in rupees, with a 14-day trial. Cancel before the next month begins and you are not charged again. Your workspace can be exported or deleted at any time.</p>
        <h2>Custom builds</h2>
        <p>Commissions are quoted in writing before any work starts. Nothing is billed until you accept the quote.</p>
        <h2>Payments</h2>
        <p>Payments are taken by Razorpay. Kognivo never sees or stores your card details. Refunds go back to the method you paid with, usually within seven working days.</p>
        <h2>Contact</h2>
        <p>{SELLER.legalName}, {SELLER.city}. {SELLER.email}{SELLER.gstin && `. GSTIN ${SELLER.gstin}`}</p>
      </article>
    </section>
  )
}
