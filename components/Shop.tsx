'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Minus, Plus, Tote, X } from '@phosphor-icons/react/dist/ssr'
import { cart, useCart } from '@/lib/cart'
import { getProduct, lineId, physical, plateNo, priceCart, rupees, unitPrice, KIND_LABEL } from '@/lib/catalogue'
import { DELIVERY, SHIPPING, isIndia, shippingFor } from '@/lib/site'
import { placeOrder, checkCallback } from '@/app/actions'
import { EASE } from './motion/hooks'

const count = (lines: { qty: number }[]) => lines.reduce((a, l) => a + l.qty, 0)

export function CartLink() {
  const lines = useCart()
  const n = count(lines)
  return (
    <Link href="/cart" className="cart-link" aria-label={`Cart, ${n} ${n === 1 ? 'item' : 'items'}`}>
      <Tote size={22} aria-hidden />
      <AnimatePresence initial={false}>
        {n > 0 && (
          <motion.span key={n} className="cart-count" initial={{ scale: 0.4, y: -6 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

/** The buy box on a product page: option choice, quantity for hardware, and the add button. */
export function AddToCart({ slug, label = 'Add to cart' }: { slug: string; label?: string }) {
  const x = getProduct(slug)!
  const [option, setOption] = useState(x.options?.[0]?.id)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const unit = unitPrice(x, option) ?? 0
  const max = Math.min(10, x.stock ?? 10)
  return (
    <div className="buy">
      {x.options && x.status !== 'soon' && (
        <fieldset className="opts">
          <legend>{x.optionLabel ?? 'Option'}</legend>
          {x.options.map((o) => (
            <label key={o.id} className="opt">
              <input type="radio" name={`opt-${slug}`} value={o.id} checked={option === o.id} onChange={() => setOption(o.id)} />
              <span>
                <b>{o.name}</b> {rupees(o.price)}
                {x.kind === 'subscription' ? ' a month' : ''}
                {o.lines && <small>{o.lines.join(', ')}</small>}
              </span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="buy-row">
        {physical(x) && (
          <div className="qty" role="group" aria-label="Quantity">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer" disabled={qty <= 1}><Minus size={16} /></button>
            <output aria-live="polite">{qty}</output>
            <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="One more" disabled={qty >= max}><Plus size={16} /></button>
          </div>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => {
            cart.add(slug, x.status === 'soon' ? undefined : option, qty)
            setAdded(true)
          }}
        >
          {label}, {rupees(unit * qty)} <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      <AnimatePresence>
        {added && (
          <motion.p className="added" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            Added. <Link href="/cart" className="link">View your cart <ArrowRight size={16} aria-hidden /></Link>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

/** One-tap add for a single-price product on a card or ledger row. */
export function QuickAdd({ slug }: { slug: string }) {
  const [added, setAdded] = useState(false)
  return (
    <button
      type="button"
      className={`quick ${added ? 'is-added' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        cart.add(slug, undefined, 1)
        setAdded(true)
        setTimeout(() => setAdded(false), 1800)
      }}
    >
      {added ? 'Added' : 'Add'}
    </button>
  )
}

export function CartView() {
  const lines = useCart()
  const { rows, subtotal, hasPhysical } = priceCart(lines)
  if (!rows.length)
    return (
      <div className="empty">
        <p className="lede">Your cart is empty. The cabinet is full, though.</p>
        <Link href="/store" className="btn">Browse the store <ArrowRight size={18} aria-hidden /></Link>
      </div>
    )
  const physicalSub = rows.filter((r) => physical(r.x)).reduce((a, r) => a + r.total, 0)
  return (
    <div className="cart">
      <ul className="cart-rows">
        <AnimatePresence initial={false}>
          {rows.map((r) => {
            const id = lineId(r)
            return (
              <motion.li key={id} layout exit={{ opacity: 0, x: -24, transition: { duration: 0.3 } }} className="cart-row">
                <Link href={`/store/${r.x.slug}`} className="cart-thumb"><img src={`/plates/${r.x.plate}.webp`} alt="" width={96} height={120} /></Link>
                <div className="cart-what">
                  <span className="plate-no">{plateNo(r.x)}</span>
                  <Link href={`/store/${r.x.slug}`} className="cart-name">{r.x.status === 'soon' ? `Early access: ${r.x.name}` : r.x.name}</Link>
                  <span className="mute">{[KIND_LABEL[r.x.kind], r.opt?.name, r.x.kind === 'subscription' ? 'monthly' : null].filter(Boolean).join(', ')}</span>
                  {r.x.sample && <span className="sample-note">Sample listing: cannot be bought</span>}
                </div>
                {physical(r.x) ? (
                  <div className="qty" role="group" aria-label={`Quantity of ${r.x.name}`}>
                    <button type="button" onClick={() => cart.setQty(id, r.qty - 1)} aria-label="One fewer" disabled={r.qty <= 1}><Minus size={16} /></button>
                    <output>{r.qty}</output>
                    <button type="button" onClick={() => cart.setQty(id, r.qty + 1)} aria-label="One more" disabled={r.qty >= Math.min(10, r.x.stock ?? 10)}><Plus size={16} /></button>
                  </div>
                ) : (
                  <span />
                )}
                <span className="cart-price">{rupees(r.total)}</span>
                <button type="button" className="cart-x" onClick={() => cart.remove(id)} aria-label={`Remove ${r.x.name}`}><X size={18} /></button>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      <aside className="cart-sum">
        <dl>
          <dt>Subtotal</dt>
          <dd>{rupees(subtotal)}</dd>
          {hasPhysical && (
            <>
              <dt>Shipping</dt>
              <dd>{shippingFor('India', physicalSub) === 0 ? 'Free in India' : `${rupees(SHIPPING.india)} in India`}, {rupees(SHIPPING.international)} abroad</dd>
            </>
          )}
        </dl>
        <Link href="/checkout" className="btn block">Check out <ArrowRight size={18} aria-hidden /></Link>
        <p className="note">Prices are in rupees. Cards from abroad are charged in INR.</p>
      </aside>
    </div>
  )
}

type Rzp = { open: () => void; on: (e: string, cb: () => void) => void }
declare global {
  interface Window {
    Razorpay?: new (o: object) => Rzp
  }
}

function loadRazorpay() {
  return new Promise<void>((ok, fail) => {
    if (window.Razorpay) return ok()
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => ok()
    s.onerror = () => fail(new Error('Could not load the payment window. Check your connection and try again.'))
    document.body.appendChild(s)
  })
}

function F({ name, label, hint, err, ...rest }: { name: string; label: string; hint?: string; err?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input className="input" name={name} id={name} aria-invalid={err ? true : undefined} aria-describedby={[hint && `${name}-hint`, err && `${name}-err`].filter(Boolean).join(' ') || undefined} {...rest} />
      {hint && <small id={`${name}-hint`}>{hint}</small>}
      {err && <span id={`${name}-err`} className="err">{err}</span>}
    </div>
  )
}

export function CheckoutView() {
  const router = useRouter()
  const lines = useCart()
  const { rows, subtotal, hasPhysical } = priceCart(lines)
  const formRef = useRef<HTMLFormElement>(null)
  const [country, setCountry] = useState('India')
  const [ack, setAck] = useState(false)
  const [pending, setPending] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  if (!rows.length)
    return (
      <div className="empty">
        <p className="lede">There is nothing to check out yet.</p>
        <Link href="/store" className="btn">Browse the store <ArrowRight size={18} aria-hidden /></Link>
      </div>
    )

  const india = isIndia(country)
  const physicalSub = rows.filter((r) => physical(r.x)).reduce((a, r) => a + r.total, 0)
  const shipping = shippingFor(country, physicalSub)
  const total = subtotal + shipping
  const kinds = new Set(rows.map((r) => (r.x.status === 'soon' ? 'preorder' : r.x.kind)))
  const notes = [
    (kinds.has('software') || kinds.has('project')) && DELIVERY.digital,
    kinds.has('subscription') && DELIVERY.subscription,
    kinds.has('hardware') && DELIVERY.hardware,
    kinds.has('preorder') && DELIVERY.preorder,
  ].filter(Boolean) as string[]

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('cart', JSON.stringify(lines))
      const res = await placeOrder(fd)
      if (!res.ok) {
        setFields(res.fields ?? {})
        setError(res.error ?? (res.fields ? 'Some details need fixing. They are marked below.' : ''))
        const first = res.fields && Object.keys(res.fields)[0]
        if (first) requestAnimationFrame(() => (formRef.current?.querySelector(`[name="${first}"]`) as HTMLElement | null)?.focus())
        return setPending(false)
      }
      setFields({})
      await loadRazorpay()
      const rzp = new window.Razorpay!({
        key: res.keyId,
        amount: res.amount,
        currency: 'INR',
        name: 'Kognivo',
        description: `${rows.length} ${rows.length === 1 ? 'item' : 'items'}`,
        order_id: res.gatewayOrderId,
        prefill: res.prefill,
        theme: { color: '#7A1F24' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await checkCallback(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature)
          cart.clear()
          router.push(`/thanks?order=${res.orderId}`)
        },
        modal: {
          ondismiss: () => {
            setPending(false)
            setError('Payment was not completed and nothing was charged. Your details are still here; press Pay to try again.')
          },
        },
      })
      rzp.on('payment.failed', () => setError('The bank declined the payment. Try another card or UPI app.'))
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
      setPending(false)
    }
  }

  return (
    <div className="checkout">
      <form ref={formRef} onSubmit={onSubmit} className="stack-form" noValidate>
        {error && <p className="alert" role="alert">{error}</p>}
        <fieldset className="group">
          <legend>You</legend>
          <F err={fields.buyer_name} name="buyer_name" label="Full name" autoComplete="name" required />
          <div className="two">
            <F err={fields.email} name="email" label="Email" type="email" autoComplete="email" hint="Receipts, licences and downloads go here." required />
            <F err={fields.phone} name="phone" label={india ? 'Mobile number' : 'Phone, with country code'} type="tel" autoComplete="tel" placeholder={india ? '98765 43210' : '+44 20 7946 0958'} hint="Only for this order." required />
          </div>
          <F name="org" label="Company or school (optional)" autoComplete="organization" />
        </fieldset>
        {hasPhysical && (
          <fieldset className="group">
            <legend>Shipping address</legend>
            <F err={fields.address} name="address" label="House or building, and street" autoComplete="street-address" required />
            <div className="two">
              <F err={fields.city} name="city" label="City" autoComplete="address-level2" required />
              <F err={fields.region} name="region" label={india ? 'State' : 'State, province or region'} autoComplete="address-level1" required={india} />
            </div>
            <div className="two">
              <F err={fields.postal} name="postal" label={india ? 'PIN code' : 'Postal code'} autoComplete="postal-code" inputMode={india ? 'numeric' : 'text'} required />
              <F name="country" label="Country" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} required />
            </div>
          </fieldset>
        )}
        <label className="check">
          <input type="checkbox" name="ack" checked={ack} onChange={(e) => setAck(e.target.checked)} aria-describedby={fields.ack ? 'ack-err' : undefined} />
          <span>I have read the <Link href="/terms" className="link">terms, shipping and refunds</Link>.</span>
        </label>
        {fields.ack && <span id="ack-err" className="err">{fields.ack}</span>}
        <button className="btn block" disabled={!ack || pending}>{pending ? 'Opening payment' : `Pay ${rupees(total)}`}</button>
        <p className="note">{ack ? 'Card, UPI or netbanking through Razorpay, in rupees.' : 'Tick the box above to enable payment.'}</p>
      </form>
      <aside className="checkout-sum">
        <ul>
          {rows.map((r) => (
            <li key={lineId(r)}>
              <img src={`/plates/${r.x.plate}.webp`} alt="" width={56} height={70} />
              <span>
                {r.x.status === 'soon' ? `Early access: ${r.x.name}` : r.x.name}
                {r.opt && <small>{r.opt.name}{r.x.kind === 'subscription' ? ', monthly' : ''}</small>}
                {r.qty > 1 && <small>× {r.qty}</small>}
              </span>
              <b>{rupees(r.total)}</b>
            </li>
          ))}
        </ul>
        <dl>
          <dt>Subtotal</dt>
          <dd>{rupees(subtotal)}</dd>
          {hasPhysical && (
            <>
              <dt>Shipping{india ? '' : ', international'}</dt>
              <dd>{shipping ? rupees(shipping) : 'Free'}</dd>
            </>
          )}
          <dt className="total">Total</dt>
          <dd className="total">{rupees(total)}</dd>
        </dl>
        {notes.map((n) => (
          <p key={n} className="note">{n}</p>
        ))}
      </aside>
    </div>
  )
}
