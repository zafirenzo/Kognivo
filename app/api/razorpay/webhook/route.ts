import { webhookSignatureOk } from '@/lib/razorpay'
import { markPaid, markRefunded } from '@/lib/db'
import { rupees } from '@/lib/catalogue'
import { sendReceipt } from '@/lib/email'
import { DELIVERY } from '@/lib/site'

// Razorpay -> Settings -> Webhooks: point at /api/razorpay/webhook with events
// payment.captured and refund.processed. This is the only place an order becomes paid.
export async function POST(req: Request) {
  const raw = await req.text()
  if (!webhookSignatureOk(raw, req.headers.get('x-razorpay-signature') ?? '')) {
    return new Response('bad signature', { status: 401 })
  }
  const evt = JSON.parse(raw)

  if (evt.event === 'payment.captured') {
    const p = evt.payload.payment.entity as { id: string; order_id: string }
    const o = await markPaid(p.order_id, p.id)
    if (o) {
      const kinds = new Set(o.items.map((i) => (i.status === 'soon' ? 'preorder' : i.kind)))
      const next = [
        (kinds.has('software') || kinds.has('project')) && DELIVERY.digital,
        kinds.has('subscription') && DELIVERY.subscription,
        kinds.has('hardware') && DELIVERY.hardware,
        kinds.has('preorder') && DELIVERY.preorder,
      ].filter(Boolean) as string[]
      await sendReceipt({
        to: o.email,
        name: o.buyer_name.split(' ')[0],
        orderId: o.id,
        items: o.items.map((i) => ({ what: `${i.status === 'soon' ? 'Early access: ' : ''}${i.name}${i.option ? `, ${i.option}` : ''}${i.qty > 1 ? ` × ${i.qty}` : ''}`, amount: rupees(i.unit * i.qty) })),
        shipping: o.shipping_paise ? rupees(o.shipping_paise / 100) : null,
        total: rupees(o.amount_paise / 100),
        next,
      })
    }
  }

  if (evt.event === 'refund.processed') {
    await markRefunded(evt.payload.refund.entity.payment_id)
  }

  return Response.json({ ok: true })
}
