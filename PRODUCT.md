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

Kognivo is a software agency and app house. It sells its own apps (licences and plans), takes early-access pre-orders for apps still in development, and takes commissions for custom builds. The site is its storefront and its proof that the apps are real.

Success: OmniReach private-beta sign-ups, paid early-access pre-orders for lab apps, and qualified custom-build enquiries.

## Positioning

Kognivo builds software that shows its work. OmniReach researches each lead, keeps only facts it can quote back to a source, writes the email from those facts, and shows the evidence before anything is sent, recording every step and every refusal. Honest, inspectable software, made by hand by a small studio, not a growth-hack tool factory.

## Operating Context

- Catalogue of nine apps: two named (OmniReach, Kyoris) and seven in development.
- Each app has a state: **beta** (waitlist, optional founding pre-order), **lab** (early-access pre-order), **live** (buy a plan). The state flips as an app ships.
- Payments in INR through Razorpay; plans billed monthly.
- Custom builds start with an enquiry form, not a checkout.

## Capabilities and Constraints

- **OmniReach** (state: beta). Campaign intelligence and personalised outreach: describe a campaign once (objective, audience, ask, tone, attachment, sending limits); it finds candidate organisations, reads their real web pages, keeps only facts it can cite, scores each lead, drafts an email grounded in those facts, shows it with its evidence for review, sends within the limits set, and stops follow-ups when a reply arrives. Gmail / Outlook / SMTP mailboxes, reply and bounce detection, one-click unsubscribe, SPF/DKIM/DMARC check, daily/hourly caps and warm-up, workspace export and deletion. Not yet hosted. Placeholder plans in code: Starter ₹1,499/mo (2 mailboxes, 500 researched leads, 2,000 emails, 1 seat), Growth ₹4,999/mo (5, 2,500, 10,000, 3 seats), Agency ₹14,999/mo (15, 10,000, 40,000, 10 seats); 14-day trial. Prices are not final.
- **Kyoris** (state: lab). Shown only as an unnamed-detail "in the lab" tease for debaters. Do not describe live transcription or rebuttal generation.
- **Nº 03 to Nº 09** (state: lab). Names and descriptions not yet supplied: placeholders only, no invented features.
- Pre-order price, refund rule and delivery window for lab apps: undecided.
- Seller legal details, GST, domain: undecided.

## Brand Commitments

- Visual brief from the founder (binding): the design, graphics and art should be arty and human like the Kalaverio site (own generative paintings made in code, hairline numbered drawings, calm serif editorial); the animation and motion should be like the Zenith Youth Summit site (pinned scroll hero with expanding window, per-character split-text reveals, horizontal pinned gallery, dealt-in cards, scroll-spy sequence, rising footer wordmark).
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
