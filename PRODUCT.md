# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + Framer Motion, deployed on Vercel, in a new repo at `~/Zafirenzo/Kognivo/Website`. Same stack family as the Kalaverio and Zenith sites; checkout reuses Kalaverio's Razorpay + Supabase pattern.

## Users

- **Founders and small teams** running sales, outreach and operations without a large team. OmniReach's buyer.
- **Students and young builders**: debaters, delegates, creators. The audience of the lab apps.
- **Businesses hiring an agency**: companies that want custom software or automation built for them.

Arrival is mostly from Instagram, WhatsApp, LinkedIn and direct links, often on a mid-range phone.

## Product Purpose

Kognivo is a software and hardware house with its own store. It sells software bought once, subscriptions, free downloads and open-source projects, hardware it builds and ships (India and abroad), and some of its own projects as bundles; it takes early-access pre-orders for apps still in development, and commissions for custom builds. One cart holds everything; Razorpay takes payment in INR.

Success: sales across the shelves, OmniReach private-beta sign-ups, paid early-access pre-orders, and qualified custom-build enquiries.

## Positioning

Kognivo builds software that shows its work. OmniReach researches each lead, keeps only facts it can quote back to a source, writes the email from those facts, and shows the evidence before anything is sent, recording every step and every refusal. Honest, inspectable software, made by hand by a small studio, not a growth-hack tool factory.

## Operating Context

- Shelves: software, subscriptions, free, open source, hardware, projects, coming soon. Every product is in `lib/catalogue.ts` with a kind and a status (available, beta, soon).
- Real products today: OmniReach (beta), Nº II for debaters and seven more in development (soon). Every other listing is a marked sample until the founder supplies the real list; samples are refused at checkout.
- One cart for mixed orders; address asked only when hardware is in it; shipping flat rates for India and abroad (placeholders).
- Payments in INR through Razorpay; subscriptions charge the first month and are renewed by an emailed link (manual, like OmniReach's UPI billing).
- Custom builds start with an enquiry form, not a checkout.

## Capabilities and Constraints

- **OmniReach** (state: beta). Campaign intelligence and personalised outreach: describe a campaign once (objective, audience, ask, tone, attachment, sending limits); it finds candidate organisations, reads their real web pages, keeps only facts it can cite, scores each lead, drafts an email grounded in those facts, shows it with its evidence for review, sends within the limits set, and stops follow-ups when a reply arrives. Gmail / Outlook / SMTP mailboxes, reply and bounce detection, one-click unsubscribe, SPF/DKIM/DMARC check, daily/hourly caps and warm-up, workspace export and deletion. Not yet hosted. Placeholder plans in code: Starter ₹1,499/mo (2 mailboxes, 500 researched leads, 2,000 emails, 1 seat), Growth ₹4,999/mo (5, 2,500, 10,000, 3 seats), Agency ₹14,999/mo (15, 10,000, 40,000, 10 seats); 14-day trial. Prices are not final.
- **Kyoris** (state: lab). Shown only as an unnamed-detail "in the lab" tease for debaters. Do not describe live transcription or rebuttal generation.
- **Nº 03 to Nº 09** (state: lab). Names and descriptions not yet supplied: placeholders only, no invented features.
- Pre-order price, refund rule and delivery window for lab apps: undecided.
- Seller legal details, GST, domain: undecided.

## Brand Commitments

- Visual brief from the founder (binding): art made in code like the Kalaverio site, motion like the Zenith Youth Summit site, and above all alive: the engraved paper-and-ink version was rejected as a graveyard. Chosen world: a riso print shop (fluorescent inks, misregistration, stickers, tape, pen notes).
- Kognivo is commercially separate: no Zafirenzo, Zenith or Kalaverio names, colours or seals on the site.
- Voice: a software company that shows its work. Product, changelog, use cases.

## Evidence on Hand

- OmniReach: feature set and test counts in `Kognivo/OmniReach/omnireach-elite/omnireach-web/README.md` and the OmniReach Build Report.
- No customers, testimonials, logos, revenue figures, screenshots or real photography exist. Do not fabricate any.

## Product Principles

1. Show the work: every claim on the page is something the product actually does.
2. Hand-made, not mass-made: a small studio, nine numbered instruments.
3. State is honest: beta, lab and live are labelled plainly; nothing in development is sold as finished.
4. One purchase path per state, short enough for a phone.

## Accessibility & Inclusion

All motion has a reduced-motion equivalent. Forms are native inputs with visible labels. WCAG AA contrast.
