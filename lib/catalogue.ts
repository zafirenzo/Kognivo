// The store. Every product is an instrument on its own engraved plate (public/plates, drawn by scripts/etch.py).
//
// kind   what it is: software (buy once), subscription (by the month), free, open-source, hardware, project
// status available (can be bought or downloaded), beta (waitlist only), soon (early-access pre-order)
// sample true marks a placeholder listing: shown with a "Sample" stamp, and refused at checkout.
// Replace the samples with real products and delete the flag.

export type Kind = 'software' | 'subscription' | 'free' | 'open-source' | 'hardware' | 'project'
export type Status = 'available' | 'beta' | 'soon'
export type Option = { id: string; name: string; price: number; lines?: string[] }

export type Product = {
  n: number
  slug: string
  name: string
  kind: Kind
  status: Status
  plate: string
  line: string
  about?: string[]
  price?: number
  options?: Option[]
  optionLabel?: string
  href?: string
  hrefLabel?: string
  licence?: string
  includes?: string[]
  specs?: [string, string][]
  stock?: number
  features?: { group: string; items: string[] }[]
  sample?: boolean
}

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX']

// TODO(founder): confirm the early-access price for coming-soon instruments.
export const PREORDER_PRICE = 499

export const KIND_LABEL: Record<Kind, string> = {
  software: 'Software',
  subscription: 'Subscription',
  free: 'Free',
  'open-source': 'Open source',
  hardware: 'Hardware',
  project: 'Project',
}

export const SHELVES: { id: Kind | 'soon'; name: string; line: string; plate: string }[] = [
  { id: 'software', name: 'Software', line: 'Buy once, keep it.', plate: 'hourglass' },
  { id: 'subscription', name: 'Subscriptions', line: 'By the month, cancel any time.', plate: 'metronome' },
  { id: 'free', name: 'Free', line: 'Free to download and use.', plate: 'inkwell' },
  { id: 'open-source', name: 'Open source', line: 'Free, with the source.', plate: 'padlock' },
  { id: 'hardware', name: 'Hardware', line: 'Built, boxed and shipped.', plate: 'macropad' },
  { id: 'project', name: 'Projects', line: 'Things we made, to take home.', plate: 'orrery' },
  { id: 'soon', name: 'Coming soon', line: 'Under cloth. Reserve early access.', plate: 'cloth-04' },
]

const omnireach: Product = {
  n: 1,
  slug: 'omnireach',
  name: 'OmniReach',
  kind: 'subscription',
  status: 'beta',
  plate: 'armillary',
  line: 'Cold outreach that cites its sources.',
  about: [
    'Describe a campaign once. OmniReach finds candidate organisations, reads their actual web pages, keeps only the facts it can quote back to a source, and writes each email from those facts.',
    'You see every draft beside its evidence, and nothing is sent until you approve it. For founders and small teams who sell without a sales team.',
  ],
  optionLabel: 'Plan',
  // TODO(founder): prices are the placeholders in OmniReach's server/core/billing.ts; confirm before the beta ends.
  options: [
    { id: 'starter', name: 'Starter', price: 1499, lines: ['2 mailboxes', '500 researched leads', '2,000 emails', '1 seat'] },
    { id: 'growth', name: 'Growth', price: 4999, lines: ['5 mailboxes', '2,500 researched leads', '10,000 emails', '3 seats'] },
    { id: 'agency', name: 'Agency', price: 14999, lines: ['15 mailboxes', '10,000 researched leads', '40,000 emails', '10 seats'] },
  ],
  features: [
    { group: 'Research', items: ['Finds candidate organisations for the campaign you describe once.', 'Reads their actual web pages and keeps only facts it can quote back to a source.', 'Scores every lead against your campaign before a word is written.'] },
    { group: 'Writing', items: ['Drafts each email from those facts, in the tone you set.', 'Shows you the draft beside its evidence. Nothing is sent until you approve.'] },
    { group: 'Sending', items: ['Gmail and Outlook by sign-in, or any mailbox by SMTP.', 'Daily and hourly caps per mailbox, with an optional warm-up ramp.', 'Replies stop the follow-ups. Bounces and opt-outs go to suppression.', 'One-click unsubscribe on every email, and an SPF, DKIM and DMARC check.'] },
    { group: 'Your data', items: ['Every step, and every refusal, is recorded.', 'Export the whole workspace, or delete it, whenever you like.'] },
  ],
}

// Sample listings: one per shelf, so every kind of product has a working page. Replace them.
const samples: Product[] = [
  {
    n: 2, slug: 'hourglass', name: 'Hourglass', kind: 'software', status: 'available', plate: 'hourglass', sample: true,
    line: 'Sample listing: a desktop app you buy once and keep.',
    about: ['This is a sample listing for software sold once, with a licence key and free updates for a year. Replace it with a real product in lib/catalogue.ts.'],
    price: 1999, includes: ['Licence for one person, on up to three computers', 'Windows, macOS and Linux downloads', 'Updates for 12 months'],
  },
  {
    n: 3, slug: 'metronome', name: 'Metronome', kind: 'subscription', status: 'available', plate: 'metronome', sample: true,
    line: 'Sample listing: a tool billed by the month.',
    about: ['This is a sample listing for a monthly subscription. Replace it with a real product in lib/catalogue.ts.'],
    optionLabel: 'Plan',
    options: [
      { id: 'solo', name: 'Solo', price: 299, lines: ['1 seat', 'Email support'] },
      { id: 'team', name: 'Team', price: 899, lines: ['5 seats', 'Priority support'] },
    ],
  },
  {
    n: 4, slug: 'inkwell', name: 'Inkwell', kind: 'free', status: 'available', plate: 'inkwell', sample: true,
    line: 'Sample listing: a free download.',
    about: ['This is a sample listing for something free to download. Replace it with a real product in lib/catalogue.ts.'],
    href: '#', hrefLabel: 'Download', includes: ['No account needed', 'Windows, macOS and Linux'],
  },
  {
    n: 5, slug: 'padlock', name: 'Padlock', kind: 'open-source', status: 'available', plate: 'padlock', sample: true,
    line: 'Sample listing: open source, free to use and change.',
    about: ['This is a sample listing for an open-source project. Point its link at the real repository in lib/catalogue.ts.'],
    href: 'https://github.com/', hrefLabel: 'View the source', licence: 'MIT',
  },
  {
    n: 6, slug: 'macropad', name: 'Macropad', kind: 'hardware', status: 'available', plate: 'macropad', sample: true,
    line: 'Sample listing: six keys and a knob, built and shipped.',
    about: ['This is a sample listing for hardware we build and ship. Replace it with a real product in lib/catalogue.ts.'],
    optionLabel: 'Switches',
    options: [
      { id: 'linear', name: 'Linear', price: 4499 },
      { id: 'tactile', name: 'Tactile', price: 4699 },
    ],
    stock: 12,
    specs: [['Keys', '6, hot-swappable'], ['Knob', '1 rotary encoder'], ['Cable', 'USB-C, 1.5 m'], ['Case', 'Aluminium']],
  },
  {
    n: 7, slug: 'beacon', name: 'Beacon', kind: 'hardware', status: 'available', plate: 'beacon', sample: true,
    line: 'Sample listing: a room sensor that reports over Wi-Fi.',
    about: ['This is a sample listing for hardware we build and ship. Replace it with a real product in lib/catalogue.ts.'],
    price: 2999, stock: 0,
    specs: [['Senses', 'Temperature, humidity, light'], ['Power', 'USB-C'], ['Network', 'Wi-Fi']],
  },
  {
    n: 8, slug: 'orrery', name: 'Orrery', kind: 'project', status: 'available', plate: 'orrery', sample: true,
    line: 'Sample listing: a finished project, with its source and a build guide.',
    about: ['This is a sample listing for one of our projects, sold as a complete bundle. Replace it with a real project in lib/catalogue.ts.'],
    price: 7999, includes: ['Full source code', 'Written build guide', 'One hour of setup help on a call'],
  },
]

// Coming soon: Nº II is for debaters, and nothing more is said until it is ready.
const soon: Product[] = Array.from({ length: 8 }, (_, i) => {
  const c = i + 2
  return {
    n: 9 + i,
    slug: `soon-${c}`,
    name: c === 2 ? 'For debaters' : 'Untitled',
    kind: 'software' as const,
    status: 'soon' as const,
    plate: `cloth-${String(c).padStart(2, '0')}`,
    line: c === 2 ? 'Something for people who argue for a living. Still under the cloth.' : 'On the bench, under cloth.',
  }
})

export const PRODUCTS: Product[] = [omnireach, ...samples, ...soon]

export const getProduct = (slug: string) => PRODUCTS.find((x) => x.slug === slug)

export const shelfOf = (x: Product): Kind | 'soon' => (x.status === 'soon' ? 'soon' : x.kind)

export const rupees = (n: number) => '₹' + n.toLocaleString('en-IN')

export const plateNo = (x: Product) => `Pl. ${ROMAN[x.n] ?? x.n}`

/** Every print of a product: the poster first, then the same thing from other angles in other inks. */
export const prints = (x: Product) =>
  x.status === 'soon' ? [`/prints/${x.plate}.webp`, `/prints/${x.plate}-1.webp`] : [0, 1, 2, 3].map((k) => `/prints/${x.plate}${k ? `-${k}` : ''}.webp`)

export const widePrint = (x: Product) => `/prints/${x.plate}-wide.webp`

/** Can it go in the cart? Free and open-source things are downloaded; beta things have a waitlist. */
export const buyable = (x: Product) =>
  x.status === 'soon' || (x.status === 'available' && x.kind !== 'free' && x.kind !== 'open-source' && x.stock !== 0)

export const physical = (x: Product) => x.kind === 'hardware' && x.status !== 'soon'

/** The price of one unit, or null if it has no price. */
export function unitPrice(x: Product, optionId?: string): number | null {
  if (x.status === 'soon') return PREORDER_PRICE
  if (x.options) return x.options.find((o) => o.id === optionId)?.price ?? null
  return x.price ?? null
}

/** "From ₹299 a month", "₹1,999", "Free". */
export function priceLabel(x: Product) {
  if (x.status === 'soon') return `${rupees(PREORDER_PRICE)} early access`
  if (x.kind === 'free' || x.kind === 'open-source') return 'Free'
  const min = x.options ? Math.min(...x.options.map((o) => o.price)) : x.price
  if (min == null) return ''
  const from = x.options && x.options.length > 1 ? 'From ' : ''
  return `${from}${rupees(min)}${x.kind === 'subscription' ? ' a month' : ''}`
}

export type Line = { slug: string; option?: string; qty: number }
export const lineId = (l: Pick<Line, 'slug' | 'option'>) => `${l.slug}:${l.option ?? ''}`

/** Prices a cart from the catalogue. The browser shows this; the server recomputes it before charging. */
export function priceCart(lines: Line[]) {
  const rows = lines.flatMap((l) => {
    const x = getProduct(l.slug)
    if (!x) return []
    const unit = unitPrice(x, l.option)
    if (unit == null) return []
    const qty = physical(x) ? Math.min(Math.max(1, Math.floor(l.qty) || 1), 10) : 1
    return [{ ...l, qty, x, unit, total: unit * qty, opt: x.options?.find((o) => o.id === l.option) }]
  })
  return { rows, subtotal: rows.reduce((a, r) => a + r.total, 0), hasPhysical: rows.some((r) => physical(r.x)) }
}
