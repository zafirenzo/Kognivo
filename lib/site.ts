export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// TODO(founder): every value here is a placeholder until confirmed.
export const SELLER = {
  name: 'Kognivo',
  legalName: 'Kognivo (legal name to be confirmed)',
  email: 'hello@kognivo.com',
  city: 'Raipur, Chhattisgarh',
  gstin: '',
}

// TODO(founder): shipping rates, in rupees. All prices are in rupees; cards from abroad are charged in INR.
export const SHIPPING = { india: 99, indiaFreeOver: 2999, international: 1999, dispatch: 'within 5 working days' }

export function shippingFor(country: string, subtotalPhysical: number) {
  if (subtotalPhysical === 0) return 0
  if (isIndia(country)) return subtotalPhysical >= SHIPPING.indiaFreeOver ? 0 : SHIPPING.india
  return SHIPPING.international
}

export const isIndia = (c: string) => /^(india|in|bharat)$/i.test(c.trim())

// TODO(founder): the delivery promises printed at checkout, in receipts and on /terms.
export const DELIVERY = {
  digital: 'Your licence and download link arrive by email as soon as the payment is confirmed.',
  subscription: 'Billed monthly. Before each new month we email you a link to renew; cancel by not renewing.',
  preorder: 'Early access means the instrument opens to you first, at the founding price. If it has not opened to you within six months of your order, you are refunded in full, without asking.',
  hardware: `Hardware ships ${SHIPPING.dispatch}, with tracking by email.`,
  project: 'The full bundle arrives by email as soon as the payment is confirmed.',
}
