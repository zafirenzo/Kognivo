# Kognivo

Kognivo's store: software (once or by the month), free and open-source tools, hardware shipped in India and abroad, projects, early-access pre-orders, and a commission form for custom builds. One cart, Razorpay checkout. See `PRODUCT.md` and `DESIGN.md`.

```bash
npm install
cp .env.example .env.local   # works without keys: forms keep rows in memory in development
npm run dev                  # http://localhost:3000
npm test                     # validation checks
npm run etch                 # redraw every plate in public/plates (Python 3, numpy, Pillow)
```

## Going live

1. Create a Supabase project for Kognivo and run `supabase/migrations/001_init.sql`.
2. Razorpay: add keys, and a webhook to `/api/razorpay/webhook` for `payment.captured` and `refund.processed`. The webhook is the only thing that marks an order paid.
3. Resend: verify the domain; set `EMAIL_FROM` and `STUDIO_INBOX`.
4. Fill every `TODO(founder)` in `lib/site.ts`, `lib/catalogue.ts` and `app/terms`: real products, prices, shipping rates, refund rules, seller details.
5. Deploy on Vercel with the variables from `.env.example`.

## Adding products

Everything lives in `lib/catalogue.ts`. Each product has a `kind` (software, subscription, free, open-source, hardware, project) and a `status` (available, beta, soon). Listings marked `sample: true` are placeholders and cannot be bought: replace them with real products. Give each new product a plate: add a scene to `scripts/etch.py`, or reuse one. Shipping rates and delivery promises are in `lib/site.ts`.

Subscriptions charge the first month at checkout; renewals are by emailed link. Move to Razorpay Subscriptions when automatic renewal matters.
