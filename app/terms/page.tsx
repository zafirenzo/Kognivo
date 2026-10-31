import type { Metadata } from 'next'
import { DELIVERY, SELLER, SHIPPING } from '@/lib/site'
import { rupees, PREORDER_PRICE } from '@/lib/catalogue'

export const metadata: Metadata = { title: 'Terms, shipping and refunds' }

// TODO(founder): a lawyer should read this page before the first real sale.
export default function Terms() {
  return (
    <section className="section">
      <article className="wrap narrow prose">
        <h1 className="page-title">Terms, shipping and refunds</h1>
        <h2>Prices</h2>
        <p>All prices are in Indian rupees. Cards from outside India are charged in INR by your bank at its own rate.</p>
        <h2>Software and projects</h2>
        <p>{DELIVERY.digital} If it does not work for you, write to {SELLER.email} within 14 days of buying and we refund you in full.</p>
        <h2>Subscriptions</h2>
        <p>{DELIVERY.subscription} Your data can be exported or deleted at any time.</p>
        <h2>Free and open-source tools</h2>
        <p>Free downloads cost nothing and need no account. Open-source projects are released under the licence named on their page; you may use, change and share them under its terms.</p>
        <h2>Hardware and shipping</h2>
        <p>{DELIVERY.hardware} Shipping within India costs {rupees(SHIPPING.india)}, and is free on hardware orders of {rupees(SHIPPING.indiaFreeOver)} or more. International shipping costs {rupees(SHIPPING.international)}; any import duties are paid by the buyer. Return unused hardware within 14 days of delivery for a full refund of its price.</p>
        <h2>Early access</h2>
        <p>Early access to an instrument still in development costs {rupees(PREORDER_PRICE)}, paid once. {DELIVERY.preorder} You can ask for a refund at any time before it opens.</p>
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
