import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'

const id = process.env.RAZORPAY_KEY_ID
const secret = process.env.RAZORPAY_KEY_SECRET

export const razorpayKeyId = id
export const paymentsReady = Boolean(id && secret)

// Standard Checkout, step 1: the server creates the order, so the amount can't be changed in the browser.
export async function createGatewayOrder(amountPaise: number, receipt: string) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`)
  return (await res.json()).id as string
}

function safeEqualHex(a: string, b: string) {
  const x = Buffer.from(a, 'utf8')
  const y = Buffer.from(b, 'utf8')
  return x.length === y.length && timingSafeEqual(x, y)
}

// Browser callback signature. Checked, but never enough on its own to mark an order paid.
export function checkoutSignatureOk(orderId: string, paymentId: string, signature: string) {
  if (!secret) return false
  return safeEqualHex(createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'), signature)
}

// The webhook is the only thing that marks an order paid.
export function webhookSignatureOk(rawBody: string, signature: string, webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET) {
  if (!webhookSecret || !signature) return false
  return safeEqualHex(createHmac('sha256', webhookSecret).update(rawBody).digest('hex'), signature)
}
