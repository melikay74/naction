# Stripe payments for membership tiers

Plan written 2026-09-21. **Updated 2026-09-22: steps 1–4 are built.** See
"What exists now" at the bottom for how to run it and what is left.

## The decision to make first: pay first, or approve first?

**Decided: approve first.**

The application form says "every application is reviewed personally," and each tier is sold **once
per service type** (one Network Partner, one Featured, one Priority, for each of towing, repair and
legal). That combination makes pay-at-application awkward: you'd be taking $99.99 from a tow company
before deciding whether to accept them, and you can't sell the Towing Network slot twice.

Recommended flow:

**Apply → you review → you approve → they get a payment link → paid → tier goes live.**

Payment is the last step, not the first. The tiers panel on the page stays informational ("choose a
membership" explains what you get), and the actual purchase happens from an email after approval.
This also means Stripe never loads on the public page — see step 6.

## The steps

### 1. Stripe account setup (no code)

- Create three Products with monthly recurring Prices: $29.99 (Get Priority), $49.99 (Get Featured),
  $99.99 (Network Partner).
- Start in **test mode**.
- Decide whether you're collecting sales tax (Stripe Tax can handle it).
- Business details, statement descriptor ("NACTION ADVISORS"), receipt email branding.

### 2. Use Stripe Checkout, hosted by Stripe

Rather than building a card form, the server creates a Checkout Session and redirects the partner to
a Stripe-hosted page. Card details never touch the server, which keeps you in the lightest PCI
category (SAQ A), and Stripe handles Apple Pay, failed cards, 3-D Secure and receipts.

Subscription mode, one line item, with the partner's ID, category and tier stamped in the session
metadata so the webhook knows what was bought.

### 3. Server: two new endpoints

- `POST /api/checkout` — checks the slot is still free (one per tier per category), creates the
  session, returns the URL.
- `POST /api/stripe/webhook` — receives events from Stripe. Needs the **raw request body** to verify
  the signature; the app currently parses JSON globally (`app.use(express.json(...))` in
  `server/src/index.ts`), so this route must be mounted *before* that middleware.
  Handle:
  - `checkout.session.completed` → activate
  - `invoice.payment_failed` → warn
  - `customer.subscription.deleted` → deactivate

New env vars in cPanel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the three price IDs.

### 4. Where the subscription lives

A `subscriptions.json` in `naction-data/` next to `partners.json` — partner ID, Stripe customer and
subscription IDs, tier, status, dates. The webhook writes it; the server reads it when ranking.

Worth thinking about: today the `"tier"` field in `partners.json` is set by hand. Either:

- the webhook edits `partners.json` automatically (less work, but a script writing a hand-edited
  file), or
- it only records the payment and the tier is still flipped manually after seeing "paid" in Stripe.

**Start manual; automate once it's trusted.**

### 5. Cancellation and card changes

Stripe's Customer Portal handles "update my card" and "cancel" — one link, no UI to build.
Cancellation fires the webhook, which frees the slot. Decide whether a cancelled tier ends
immediately or at the end of the paid month (Stripe supports both).

### 6. Privacy and the consent banner

Stripe.js on the page sets cookies and phones home — that would trigger the consent banner for every
accident victim, for a feature they'll never use. Hosted Checkout avoids this entirely: nothing from
Stripe loads on nactionadvisors.com, and the README's "zero external requests on load" stays true.

Needs:

- Privacy policy paragraph naming Stripe as a payment processor and what's shared (business name,
  contact email).
- Terms of service for the subscription — billing cycle, cancellation, refunds. Lawyer item,
  alongside the CalOPPA / § 6155 / paid-placement disclosure items already in README.md.

### 7. Emails

Reuse `server/src/email.ts`:

- approval email with the checkout link
- "you're live" confirmation once paid
- heads-up on failed payment before the slot is dropped

### 8. Testing

Stripe's test cards plus the Stripe CLI, which forwards webhooks to the local server:

```bash
stripe listen --forward-to localhost:3011/api/stripe/webhook
```

The whole flow — including failed payments and cancellations — can be exercised locally before
anything real is charged.

### 9. Going live

- Swap test keys for live in the cPanel env vars.
- Register the live webhook endpoint at `https://nactionadvisors.com/api/stripe/webhook`.
- Run one real subscription and refund it.

## Effort

Steps 2–4 and 7 are roughly a day of focused work; the webhook and slot-checking logic is where the
care goes. Stripe dashboard setup (1) and legal text (6) are on the business side.

A sensible first slice: step 3's checkout endpoint plus a manual tier flip — enough to take a real
payment — with webhook automation as a second pass.

---

# What exists now (2026-09-22)

Approve-first, manual activation. Nothing Stripe-related loads on the public
site — the only public route is the webhook.

## Files

| file | does |
| --- | --- |
| `server/src/stripe.ts` | Stripe client; resolves each tier's price from its product's `default_price`; creates Checkout Sessions |
| `server/src/stripeWebhook.ts` | `POST /api/stripe/webhook` — verifies signatures, records payments |
| `server/src/subscriptions.ts` | writes `subscriptions.json` in the data directory, atomically and idempotently |
| `scripts/stripe-check.mjs` | `npm run stripe:check` — confirms account + all three products resolve |
| `scripts/checkout-link.mjs` | `npm run checkout-link -- …` — mints a checkout URL for one approved applicant |

**Do not move the `app.use(stripeWebhook())` line in `server/src/index.ts`.** It
sits above `express.json()` because signature verification needs the raw bytes,
and above the staging password gate because Stripe cannot authenticate. Either
mistake breaks payments quietly.

## Selling a membership

1. Add the business to `partners.json` **untiered**.
2. Mint a link — it refuses if that tier's slot for the category is taken:

   ```
   npm run checkout-link -- --partner tow-la-002 --tier featured \
                            --email owner@example.com --name "Westside Tow"
   ```

3. Email them the URL (good for 24 hours).
4. When they pay, the server log prints `MEMBERSHIP PAID` with the partner id.
5. Set `"tier": "featured"` on that record in `partners.json`. No restart needed.

Cancellation prints `MEMBERSHIP ENDED`; remove the `tier` field to free the slot.

## Testing locally

The CLI lives at `tools/stripe` — a single binary from Stripe's GitHub
releases, gitignored. Homebrew is not required. To replace or update it:

```
curl -sL -o /tmp/stripe.tar.gz \
  https://github.com/stripe/stripe-cli/releases/latest/download/stripe_<version>_mac-os_arm64.tar.gz
tar -xzf /tmp/stripe.tar.gz -C tools
```

Then, from `site/`:

```
npm run stripe:login     # one-time, opens a browser to pair with your account
npm run stripe:listen    # forwards live events to the local server
```

`stripe listen` prints a `whsec_…` — put it in `.env` as `STRIPE_WEBHOOK_SECRET`.
It is a different value from the production one and changes each run.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

## Done

- **The thank-you page** at `/membership/thanks` — Stripe's `success_url`. Built
  as `client/src/pages/MembershipThanks.tsx`, backed by a read-only lookup at
  `GET /api/membership/session?id=cs_…` (`server/src/membership.ts`) so the
  confirmation shows the real business name, tier and amount. It handles four
  states: paid, unpaid (back-button into an abandoned checkout), lookup failed
  (still confirms — they have paid, our API's problem is not theirs), and no
  session id at all (confirms nothing, since anyone can type the URL). Carries
  `noindex`. Activation is still manual by design, and the page says so.

## Still to do

- **Recreate the three products in the live account.** The ids currently in
  `site/.env` are from the sandbox; products do not cross over. Live ids go in
  the cPanel env vars, never in the repository.
- **Register the production webhook** at
  `https://nactionadvisors.com/api/stripe/webhook`, subscribed to
  `checkout.session.completed`, `invoice.payment_failed`,
  `customer.subscription.deleted`. Put its signing secret in cPanel.
- **Complete the account details** so `charges_enabled` becomes true.
- **Customer Portal** for card updates and self-service cancellation (one link,
  no UI to build).
- **Emails**: approval email carrying the link, "you're live" confirmation,
  failed-payment warning. Reuse `server/src/email.ts`.
- **Automate activation** once the manual flow is trusted — the webhook would
  edit `partners.json` itself instead of printing an instruction.
- **Terms of service** for the subscription: billing cycle, cancellation,
  refunds. Lawyer item, with the CalOPPA / § 6155 / paid-placement questions.
