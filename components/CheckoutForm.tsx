'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCheckout, checkCallback } from '@/app/actions'

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

export function CheckoutForm({ instrument, plan, what, price, rule }: { instrument: string; plan?: string; what: string; price: string; rule: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [ack, setAck] = useState(false)
  const [pending, setPending] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')
    try {
      const res = await createCheckout(new FormData(e.currentTarget))
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
        description: what,
        order_id: res.gatewayOrderId,
        prefill: res.prefill,
        theme: { color: '#7A1F24' },
        handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await checkCallback(r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature)
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
    <form ref={formRef} onSubmit={onSubmit} className="stack-form" noValidate>
      <input type="hidden" name="instrument" value={instrument} />
      {plan && <input type="hidden" name="plan" value={plan} />}
      {error && <p className="alert" role="alert">{error}</p>}
      <F err={fields.buyer_name} name="buyer_name" label="Full name" autoComplete="name" required />
      <div className="two">
        <F err={fields.email} name="email" label="Email" type="email" autoComplete="email" hint="Your receipt goes here." required />
        <F err={fields.phone} name="phone" label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" hint="Only for this order." required />
      </div>
      <F name="org" label="Company or school (optional)" autoComplete="organization" />
      <label className="check">
        <input type="checkbox" name="ack" checked={ack} onChange={(e) => setAck(e.target.checked)} aria-describedby={fields.ack ? 'ack-err' : undefined} />
        <span>{rule}</span>
      </label>
      {fields.ack && <span id="ack-err" className="err">{fields.ack}</span>}
      <button className="btn block" disabled={!ack || pending} aria-describedby="pay-note">
        {pending ? 'Opening payment' : `Pay ${price}`}
      </button>
      <p id="pay-note" className="note">{ack ? 'Card, UPI or netbanking through Razorpay.' : 'Tick the box above to enable payment.'}</p>
    </form>
  )
}
