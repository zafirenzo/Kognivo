import { webhookSignatureOk } from '@/lib/razorpay'
import { markPaid, markRefunded } from '@/lib/db'
import { getInstrument, plateTitle, rupees } from '@/lib/catalogue'
import { sendReceipt } from '@/lib/email'
import { PREORDER_RULE } from '@/lib/site'

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
    const x = o && getInstrument(o.instrument)
    if (o && x) {
      const plan = x.plans?.find((pl) => pl.id === o.plan)
      await sendReceipt({
        to: o.email,
        name: o.buyer_name.split(' ')[0],
        what: plan ? `${x.name}, ${plan.name} plan` : `Early access to ${plateTitle(x)}`,
        amount: rupees(o.amount_paise / 100),
        orderId: o.id,
        next: plan ? 'Your workspace is ready. Sign in with this email address.' : `${PREORDER_RULE.what} ${PREORDER_RULE.refund}`,
      })
    }
  }

  if (evt.event === 'refund.processed') {
    await markRefunded(evt.payload.refund.entity.payment_id)
  }

  return Response.json({ ok: true })
}
