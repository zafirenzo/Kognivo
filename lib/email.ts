import 'server-only'
import { SELLER, SITE_URL } from './site'

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

async function send(to: string, subject: string, html: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return console.warn('[email] RESEND_API_KEY missing; not sent:', subject)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? `Kognivo <${SELLER.email}>`, to, subject, html, reply_to: replyTo }),
  })
  if (!res.ok) console.error('[email] Resend failed', res.status, await res.text())
}

const frame = (body: string) => `
  <div style="background:#EDE7DA;padding:40px 24px;font-family:Georgia,serif;color:#1F1416">
    <div style="max-width:520px;margin:0 auto">
      <p style="letter-spacing:.32em;font-size:12px;margin:0 0 32px">KOGNIVO</p>
      ${body}
      <p style="font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#5A4A4C;margin-top:40px">${esc(SELLER.name)}, ${esc(SELLER.city)}. ${esc(SELLER.email)}</p>
    </div>
  </div>`

type Receipt = { to: string; name: string; orderId: string; items: { what: string; amount: string }[]; shipping: string | null; total: string; next: string[] }

export function sendReceipt(r: Receipt) {
  const row = (a: string, b: string, strong = false) =>
    `<tr><td style="padding:6px 0;${strong ? 'font-weight:bold' : 'color:#5A4A4C'}">${esc(a)}</td><td style="text-align:right;${strong ? 'font-weight:bold' : ''}">${esc(b)}</td></tr>`
  return send(
    r.to,
    `Receipt for order ${r.orderId.slice(0, 8).toUpperCase()}`,
    frame(`
      <h1 style="font-weight:500;font-size:30px;line-height:38px;margin:0 0 16px">Thank you, ${esc(r.name)}.</h1>
      <p style="font-family:Arial,sans-serif;font-size:16px;line-height:26px">Your payment is confirmed. Order ${esc(r.orderId.slice(0, 8).toUpperCase())}.</p>
      <table style="font-family:Arial,sans-serif;font-size:15px;line-height:24px;border-collapse:collapse;width:100%;margin:24px 0">
        ${r.items.map((i) => row(i.what, i.amount)).join('')}
        ${r.shipping ? row('Shipping', r.shipping) : ''}
        ${row('Paid', r.total, true)}
      </table>
      ${r.next.map((n) => `<p style="font-family:Arial,sans-serif;font-size:16px;line-height:26px">${esc(n)}</p>`).join('')}
      <p style="font-family:Arial,sans-serif;font-size:16px;line-height:26px"><a style="color:#7A1F24" href="${SITE_URL}/terms">Terms, shipping and refunds</a></p>`),
  )
}

export function notifyCommission(c: { name: string; email: string; company: string; brief: string; budget: string; timeline: string }) {
  const to = process.env.STUDIO_INBOX ?? SELLER.email
  return send(
    to,
    `Commission enquiry: ${c.name}${c.company ? `, ${c.company}` : ''}`,
    frame(`
      <h1 style="font-weight:500;font-size:26px;line-height:34px;margin:0 0 16px">${esc(c.name)} wants something built.</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:24px;white-space:pre-wrap">${esc(c.brief)}</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#5A4A4C">${esc(c.email)}<br>Budget: ${esc(c.budget || 'not said')}<br>Timeline: ${esc(c.timeline || 'not said')}</p>`),
    c.email,
  )
}
