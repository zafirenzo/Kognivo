// The cabinet. Nine instruments, each on its own plate.
// State decides what a visitor can do: 'beta' joins the waitlist, 'lab' reserves early access,
// 'live' buys a plan. Flip an instrument's state when it ships; the pages follow.

export type State = 'beta' | 'lab' | 'live'

export type Plan = { id: string; name: string; price: number; lines: string[] }

export type Instrument = {
  n: number
  slug: string
  name: string
  plate: string
  state: State
  line: string
  for?: string
  features?: { group: string; items: string[] }[]
  plans?: Plan[]
}

export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

// TODO(founder): confirm the early-access price for lab instruments, and the refund rule in lib/site.ts.
export const PREORDER_PRICE = 499

const omnireach: Instrument = {
  n: 1,
  slug: 'omnireach',
  name: 'OmniReach',
  plate: 'armillary',
  state: 'beta',
  line: 'Cold outreach that cites its sources.',
  for: 'Founders and small teams who sell without a sales team.',
  features: [
    {
      group: 'Research',
      items: [
        'Finds candidate organisations for the campaign you describe once.',
        'Reads their actual web pages and keeps only facts it can quote back to a source.',
        'Scores every lead against your campaign before a word is written.',
      ],
    },
    {
      group: 'Writing',
      items: [
        'Drafts each email from those facts, in the tone you set.',
        'Shows you the draft beside its evidence. Nothing is sent until you approve.',
      ],
    },
    {
      group: 'Sending',
      items: [
        'Gmail and Outlook by sign-in, or any mailbox by SMTP.',
        'Daily and hourly caps per mailbox, with an optional warm-up ramp.',
        'Replies stop the follow-ups. Bounces and opt-outs go to suppression.',
        'One-click unsubscribe on every email, and an SPF, DKIM and DMARC check.',
      ],
    },
    {
      group: 'Your data',
      items: ['Every step, and every refusal, is recorded.', 'Export the whole workspace, or delete it, whenever you like.'],
    },
  ],
  // TODO(founder): prices are the placeholders in server/core/billing.ts; confirm before the beta ends.
  plans: [
    { id: 'starter', name: 'Starter', price: 1499, lines: ['2 mailboxes', '500 researched leads', '2,000 emails', '1 seat'] },
    { id: 'growth', name: 'Growth', price: 4999, lines: ['5 mailboxes', '2,500 researched leads', '10,000 emails', '3 seats'] },
    { id: 'agency', name: 'Agency', price: 14999, lines: ['15 mailboxes', '10,000 researched leads', '40,000 emails', '10 seats'] },
  ],
}

// Nº II is for debaters. Nothing more is said until it is ready.
const lab: Instrument[] = Array.from({ length: 8 }, (_, i) => {
  const n = i + 2
  return {
    n,
    slug: `no-${n}`,
    name: n === 2 ? 'For debaters' : 'Untitled',
    plate: `cloth-${String(n).padStart(2, '0')}`,
    state: 'lab' as const,
    line: n === 2 ? 'Something for people who argue for a living. Still under the cloth.' : 'On the bench, under cloth.',
  }
})

export const INSTRUMENTS: Instrument[] = [omnireach, ...lab]

export const getInstrument = (slug: string) => INSTRUMENTS.find((x) => x.slug === slug)

export const STATE_LABEL: Record<State, string> = { beta: 'Private beta', lab: 'In the lab', live: 'Available' }

export const rupees = (n: number) => '₹' + n.toLocaleString('en-IN')

export const plateTitle = (x: Instrument) => `Pl. ${ROMAN[x.n]}`
