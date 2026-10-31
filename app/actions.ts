'use server'
import { headers } from 'next/headers'
import { addToWaitlist, addCommission, insertOrder, attachGatewayOrder, db, type OrderItem } from '@/lib/db'
import { getProduct, priceCart, buyable, physical, type Line } from '@/lib/catalogue'
import { createGatewayOrder, paymentsReady, razorpayKeyId, checkoutSignatureOk } from '@/lib/razorpay'
import { notifyCommission } from '@/lib/email'
import { normEmail, normPhone } from '@/lib/validate'
import { SELLER, isIndia, shippingFor } from '@/lib/site'

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
  const instrument = getProduct(String(fd.get('instrument') ?? ''))?.slug ?? 'omnireach'
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

export async function placeOrder(fd: FormData): Promise<CheckoutResult> {
  const get = (k: string) => String(fd.get(k) ?? '').trim()
  let lines: Line[] = []
  try {
    lines = JSON.parse(get('cart') || '[]')
  } catch {}
  const { rows, subtotal, hasPhysical } = priceCart(Array.isArray(lines) ? lines.slice(0, 30) : [])
  if (!rows.length) return { ok: false, error: 'Your cart is empty.' }
  const blocked = rows.filter((r) => !buyable(r.x) || r.x.sample)
  if (blocked.length) {
    return { ok: false, error: `Remove ${blocked.map((r) => r.x.name).join(', ')} from your cart: ${blocked.some((r) => r.x.sample) ? 'sample listings cannot be bought' : 'not on sale right now'}.` }
  }
  // ponytail: stock is the static number in lib/catalogue.ts; move it to the database when hardware sells in volume
  const short = rows.find((r) => r.x.stock != null && r.qty > r.x.stock)
  if (short) return { ok: false, error: `Only ${short.x.stock} ${short.x.name} left. Lower the quantity in your cart.` }

  const f: Record<string, string> = {}
  const name = get('buyer_name')
  if (name.length < 2) f.buyer_name = 'Enter your full name.'
  const email = normEmail(get('email'))
  if (!email) f.email = 'Enter an email address, like name@company.com.'
  const country = hasPhysical ? get('country') || 'India' : 'India'
  const india = isIndia(country)
  const rawPhone = get('phone')
  const phone = india ? normPhone(rawPhone) : /^\+?[\d\s()-]{7,20}$/.test(rawPhone) ? rawPhone.replace(/[^\d+]/g, '') : null
  if (!phone) f.phone = india ? 'Enter a 10-digit mobile number.' : 'Enter a phone number with its country code, like +44 20 7946 0958.'
  let shipTo: Record<string, string> | null = null
  if (hasPhysical) {
    shipTo = { line: get('address'), city: get('city'), region: get('region'), postal: get('postal'), country }
    if (shipTo.line.length < 6) f.address = 'Enter your house or building and street.'
    if (!shipTo.city) f.city = 'Enter your city.'
    if (india ? !/^[1-9]\d{5}$/.test(shipTo.postal) : shipTo.postal.length < 3) f.postal = india ? 'Enter a 6-digit PIN code.' : 'Enter your postal code.'
    if (india && !shipTo.region) f.region = 'Enter your state.'
  }
  if (fd.get('ack') !== 'on') f.ack = 'Tick the box to confirm you have read the terms.'
  if (Object.keys(f).length) return { ok: false, fields: f }

  if (!paymentsReady || !db) return { ok: false, error: 'Payments are not connected yet. Add the Razorpay and Supabase keys to the environment.' }

  const physicalSubtotal = rows.filter((r) => physical(r.x)).reduce((a, r) => a + r.total, 0)
  const shipping = shippingFor(country, physicalSubtotal)
  const amount = (subtotal + shipping) * 100
  const items: OrderItem[] = rows.map((r) => ({ slug: r.x.slug, name: r.x.name, option: r.opt?.name ?? null, qty: r.qty, unit: r.unit, kind: r.x.kind, status: r.x.status }))
  const orderId = await insertOrder({
    items, buyer_name: name, email, phone, company: get('org').slice(0, 120) || null, ship_to: shipTo,
    subtotal_paise: subtotal * 100, shipping_paise: shipping * 100, amount_paise: amount,
  })
  const gatewayOrderId = await createGatewayOrder(amount, orderId.slice(0, 40))
  await attachGatewayOrder(orderId, gatewayOrderId)
  return { ok: true, orderId, gatewayOrderId, keyId: razorpayKeyId!, amount, prefill: { name, email: email!, contact: india ? `+91${phone}` : phone! } }
}

// The browser callback. Checked for tampering, but it never marks an order paid: only the webhook does.
export async function checkCallback(gatewayOrderId: string, paymentId: string, signature: string) {
  return checkoutSignatureOk(gatewayOrderId, paymentId, signature)
}
