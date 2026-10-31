export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

// TODO(founder): every value here is a placeholder until confirmed.
export const SELLER = {
  name: 'Kognivo',
  legalName: 'Kognivo (legal name to be confirmed)',
  email: 'hello@kognivo.com',
  city: 'Raipur, Chhattisgarh',
  gstin: '',
}

// TODO(founder): the early-access rule printed at checkout and on /terms.
export const PREORDER_RULE = {
  what: 'Early access means you get the instrument the day it opens to its first users, at the founding price, before anyone else.',
  refund: 'If the instrument has not opened to you within six months of your order, you are refunded in full, without asking.',
}
