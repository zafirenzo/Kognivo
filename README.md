# Kognivo

The storefront for Kognivo's instruments: OmniReach (private beta), eight apps in the lab (early-access pre-orders), and custom builds (commission form). See `PRODUCT.md` and `DESIGN.md`.

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
4. Fill every `TODO(founder)` in `lib/site.ts` and `lib/catalogue.ts`: early-access price and refund rule, plan prices, seller details.
5. Deploy on Vercel with the variables from `.env.example`.

## Changing what an instrument is

Everything lives in `lib/catalogue.ts`. Set `state` to `beta` (waitlist), `lab` (early-access pre-order) or `live` (buy a plan). Give a lab instrument its real `name` and `line` when it is ready to be shown.
