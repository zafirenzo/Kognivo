'use server'
import { headers } from 'next/headers'
import { addToWaitlist, addCommission, insertOrder, attachGatewayOrder, db } from '@/lib/db'
import { getInstrument, PREORDER_PRICE } from '@/lib/catalogue'
import { createGatewayOrder, paymentsReady, razorpayKeyId, checkoutSignatureOk } from '@/lib/razorpay'
import { notifyCommission } from '@/lib/email'
import { normEmail, normPhone } from '@/lib/validate'
import { SELLER } from '@/lib/site'

export type FormState = { ok?: boolean; message?: string; error?: string; fields?: Record<string, string>; values?: Record<string, string> }

// ponytail: per-instance memory throttle; move to the database if bots get past the honeypot
const recent = new Map<string, number>()
async function throttled(kind: string, ms: number) {
  const ip = kind + ':' + ((await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local')
  const now = Date.now()
  if (now - (recent.get(ip) ?? 0) < ms) return true
  recent.set(ip, now)
  return false
}

export async function joinWaitlist(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('company')) return { ok: true, message: 'You are on the list.' } // honeypot
  const values = { email: String(fd.get('email') ?? '').trim() }
  const email = normEmail(values.email)
  if (!email) return { values, error: 'Enter an email address, like name@company.com.' }
  if (await throttled('waitlist', 6000)) return { values, error: 'You just signed up. Wait a few seconds before trying again.' }
  const instrument = getInstrument(String(fd.get('instrument') ?? ''))?.slug ?? 'omnireach'
  let res: 'ok' | 'duplicate'
  try {
    res = await addToWaitlist(email, instrument)
  } catch (e) {
    console.error('[waitlist]', e)
    return { values, error: `We could not save that just now. Try again in a minute, or write to ${SELLER.email}.` }
  }
  return {
    ok: true,
    message: res === 'duplicate' ? 'You are already on the list. We will write when your seat opens.' : 'You are on the list. We will write when your seat opens.',
  }
}

export async function sendCommission(_: FormState, fd: FormData): Promise<FormState> {
  if (fd.get('website')) return { ok: true } // honeypot
  const get = (k: string) => String(fd.get(k) ?? '').trim()
  const f: Record<string, string> = {}
  const name = get('name')
  if (name.length < 2) f.name = 'Enter your name.'
  const email = normEmail(get('email'))
  if (!email) f.email = 'Enter an email address, like name@company.com.'
  const brief = get('brief')
  if (brief.length < 30) f.brief = 'Tell us a little more: what it should do, and for whom. A few sentences is enough.'
  // Sent back so the form keeps what was typed (React resets a form after its action runs).
  const values = Object.fromEntries(['name', 'email', 'org', 'brief', 'budget', 'timeline'].map((k) => [k, get(k)]))
  if (Object.keys(f).length) return { fields: f, values, error: 'A few details need fixing. They are marked below.' }
  if (await throttled('commission', 20000)) return { values, error: 'Your enquiry was just sent. Wait a few seconds before sending another.' }
  const row = { name, email: email!, company: get('org').slice(0, 120), brief: brief.slice(0, 4000), budget: get('budget').slice(0, 60), timeline: get('timeline').slice(0, 60) }
  try {
    await addCommission(row)
    await notifyCommission(row)
  } catch (e) {
    console.error('[commission]', e)
    return { values, error: `We could not send that just now. Try again in a minute, or write to ${SELLER.email}.` }
  }
  return { ok: true, message: `Thank you, ${name.split(' ')[0]}. We read every enquiry and reply within three working days.` }
}

export type CheckoutResult =
  | { ok: true; orderId: string; gatewayOrderId: string; keyId: string; amount: number; prefill: { name: string; email: string; contact: string } }
  | { ok: false; error?: string; fields?: Record<string, string> }

export async function createCheckout(fd: FormData): Promise<CheckoutResult> {
  const get = (k: string) => String(fd.get(k) ?? '').trim()
  const x = getInstrument(get('instrument'))
  if (!x) return { ok: false, error: 'That instrument does not exist.' }
  const plan = x.state === 'live' ? x.plans?.find((p) => p.id === get('plan')) : undefined
  if (x.state === 'beta') return { ok: false, error: `${x.name} is in private beta. Join the waitlist on its page instead.` }
  if (x.state === 'live' && !plan) return { ok: false, error: 'Choose a plan.' }

  const f: Record<string, string> = {}
  const name = get('buyer_name')
  if (name.length < 2) f.buyer_name = 'Enter your full name.'
  const email = normEmail(get('email'))
  if (!email) f.email = 'Enter an email address, like name@company.com.'
  const phone = normPhone(get('phone'))
  if (!phone) f.phone = 'Enter a 10-digit mobile number.'
  if (fd.get('ack') !== 'on') f.ack = 'Tick the box to confirm you have read the terms.'
  if (Object.keys(f).length) return { ok: false, fields: f }

  if (!paymentsReady || !db) return { ok: false, error: 'Payments are not connected yet. Add the Razorpay and Supabase keys to the environment.' }

  const amount = (plan ? plan.price : PREORDER_PRICE) * 100
  const orderId = await insertOrder({
    instrument: x.slug, kind: plan ? 'plan' : 'preorder', plan: plan?.id ?? null,
    buyer_name: name, email, phone, company: get('org').slice(0, 120) || null, amount_paise: amount,
  })
  const gatewayOrderId = await createGatewayOrder(amount, orderId.slice(0, 40))
  await attachGatewayOrder(orderId, gatewayOrderId)
  return { ok: true, orderId, gatewayOrderId, keyId: razorpayKeyId!, amount, prefill: { name, email: email!, contact: `+91${phone}` } }
}

// The browser callback. Checked for tampering, but it never marks an order paid: only the webhook does.
export async function checkCallback(gatewayOrderId: string, paymentId: string, signature: string) {
  return checkoutSignatureOk(gatewayOrderId, paymentId, signature)
}
