import 'server-only'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
// Server-only, service role. Never import this file from a client component.
export const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null

function need() {
  if (!db) throw new Error('Supabase is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).')
  return db
}

const dev = new Map<string, unknown[]>()
// Without Supabase in development, rows are kept in memory so every form can be tried.
function devInsert(table: string, row: unknown) {
  if (process.env.NODE_ENV === 'production') need()
  console.warn(`[${table}] Supabase not configured; keeping in memory:`, row)
  dev.set(table, [...(dev.get(table) ?? []), row])
}

export async function addToWaitlist(email: string, instrument: string): Promise<'ok' | 'duplicate'> {
  if (!db) {
    const rows = (dev.get('waitlist') ?? []) as { email: string; instrument: string }[]
    if (rows.some((r) => r.email === email && r.instrument === instrument)) return 'duplicate'
    devInsert('waitlist', { email, instrument })
    return 'ok'
  }
  const { error } = await db.from('waitlist').insert({ email, instrument })
  if (error?.code === '23505') return 'duplicate'
  if (error) throw error
  return 'ok'
}

export async function addCommission(row: Record<string, unknown>) {
  if (!db) return devInsert('commissions', row)
  const { error } = await db.from('commissions').insert(row)
  if (error) throw error
}

export async function insertOrder(row: Record<string, unknown>) {
  const { data, error } = await need().from('orders').insert(row).select('id').single()
  if (error) throw error
  return data.id as string
}

export async function attachGatewayOrder(id: string, gatewayOrderId: string) {
  const { error } = await need().from('orders').update({ gateway_order_id: gatewayOrderId }).eq('id', id)
  if (error) throw error
}

// Only what the confirmation page shows; the id is an unguessable uuid.
export async function getOrderPublic(id: string) {
  if (!db || !/^[0-9a-f-]{36}$/.test(id)) return null
  const { data } = await db.from('orders').select('id, instrument, kind, plan, status, amount_paise').eq('id', id).maybeSingle()
  return data as null | { id: string; instrument: string; kind: 'plan' | 'preorder'; plan: string | null; status: string; amount_paise: number }
}

// Idempotent: a webhook retry finds the order already paid and changes nothing.
export async function markPaid(gatewayOrderId: string, paymentId: string) {
  const { data, error } = await need()
    .from('orders')
    .update({ status: 'paid', gateway_payment_id: paymentId, paid_at: new Date().toISOString() })
    .eq('gateway_order_id', gatewayOrderId)
    .eq('status', 'created')
    .select('id, instrument, kind, plan, email, buyer_name, amount_paise')
    .maybeSingle()
  if (error) throw error
  return data as null | { id: string; instrument: string; kind: 'plan' | 'preorder'; plan: string | null; email: string; buyer_name: string; amount_paise: number }
}

export async function markRefunded(paymentId: string) {
  const { error } = await need().from('orders').update({ status: 'refunded' }).eq('gateway_payment_id', paymentId)
  if (error) throw error
}
