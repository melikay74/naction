import express from 'express';
import type Stripe from 'stripe';
import { getStripe, stripeConfigured } from './stripe.js';
import { saveSubscription, updateSubscriptionStatus } from './subscriptions.js';
import { isTier } from './types.js';
import type { Tier } from './types.js';

/**
 * Stripe's webhook endpoint.
 *
 * Three things about where this is mounted matter, and all three are easy to
 * break by moving it:
 *
 *  1. It must come BEFORE express.json(). Signature verification hashes the
 *     exact bytes Stripe sent; once a JSON parser has re-serialised the body
 *     the signature can never match, and every event fails with no clue why.
 *  2. It must come BEFORE the staging password gate. Stripe cannot send a
 *     password, so behind the gate every event gets a 401 and Stripe
 *     eventually disables the endpoint.
 *  3. It answers 2xx as soon as the event is recorded. Stripe retries anything
 *     slower than ~20s or non-2xx, so slow work here turns into duplicate
 *     deliveries.
 *
 * Needs STRIPE_WEBHOOK_SECRET (whsec_…) from `stripe listen` locally, or from
 * the endpoint's signing secret in the dashboard in production.
 */

function tierFrom(metadata: Stripe.Metadata | null | undefined): Tier | null {
  const value = metadata?.tier;
  return isTier(value) ? value : null;
}

function money(amount: number | null | undefined, currency: string | undefined): string {
  if (amount == null) return 'unknown';
  const symbol = (currency ?? 'usd').toLowerCase() === 'usd' ? '$' : `${(currency ?? '').toUpperCase()} `;
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

/**
 * A paid checkout. This is the event that means "they have paid" — the
 * subscription itself exists slightly earlier, but not yet funded.
 */
async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.payment_status !== 'paid') {
    console.warn(
      `[naction] checkout ${session.id} completed but payment_status is ` +
        `"${session.payment_status}" — not recording a membership yet.`,
    );
    return;
  }

  const metadata = session.metadata;
  const tier = tierFrom(metadata);
  const partnerId = metadata?.partnerId;

  if (!tier || !partnerId) {
    // Only sessions this app created carry metadata. Anything else was made
    // elsewhere (a dashboard payment link, say) and cannot be matched.
    console.error(
      `[naction] checkout ${session.id} has no partnerId/tier metadata — ` +
        'cannot tell which membership was bought. Was the link made outside scripts/checkout-link.mjs?',
    );
    return;
  }

  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) {
    console.error(`[naction] checkout ${session.id} has no subscription attached — ignoring.`);
    return;
  }

  const now = new Date().toISOString();
  const isNew = await saveSubscription({
    id: subscriptionId,
    partnerId,
    tier,
    category: metadata?.category ?? 'unknown',
    businessName: metadata?.businessName ?? 'unknown',
    status: 'active',
    customerId: typeof session.customer === 'string' ? session.customer : (session.customer?.id ?? ''),
    email: session.customer_details?.email ?? session.customer_email ?? '',
    amount: money(session.amount_total, session.currency ?? undefined),
    createdAt: now,
    updatedAt: now,
  });

  // The operator acts on this line: activation stays manual on purpose, so a
  // webhook never edits the hand-maintained partner directory. Only announced
  // for a genuinely new subscription — Stripe redelivers events, and being
  // told twice to activate the same membership is how mistakes happen.
  if (isNew) {
    console.log(
      `\n[naction] MEMBERSHIP PAID\n` +
        `  ${metadata?.businessName ?? partnerId} (${partnerId})\n` +
        `  ${tier} — ${money(session.amount_total, session.currency ?? undefined)}\n` +
        `  Set "tier": "${tier}" on ${partnerId} in partners.json to put them live.\n`,
    );
  } else {
    console.log(`[naction] checkout ${session.id} redelivered — membership already recorded.`);
  }
}

/** A renewal failed. The membership is not dead yet — Stripe will retry. */
function onPaymentFailed(invoice: Stripe.Invoice): void {
  const subscriptionId = (invoice as unknown as { subscription?: string | { id: string } }).subscription;
  const id = typeof subscriptionId === 'string' ? subscriptionId : subscriptionId?.id;
  console.warn(
    `[naction] payment FAILED for subscription ${id ?? '(unknown)'} ` +
      `(${invoice.customer_email ?? 'no email'}). Stripe will retry; the tier is still live for now.`,
  );
  if (id) void updateSubscriptionStatus(id, 'past_due');
}

/** The membership ended — the slot is free again. */
async function onSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const metadata = subscription.metadata;
  await updateSubscriptionStatus(subscription.id, 'canceled', new Date().toISOString());
  console.log(
    `\n[naction] MEMBERSHIP ENDED\n` +
      `  ${metadata?.businessName ?? subscription.id} (${metadata?.partnerId ?? 'unknown partner'})\n` +
      `  ${metadata?.tier ?? 'unknown tier'} — the slot is now free.\n` +
      `  Remove "tier" from ${metadata?.partnerId ?? 'that partner'} in partners.json.\n`,
  );
}

export function stripeWebhook(): express.Router {
  const router = express.Router();

  router.post(
    '/api/stripe/webhook',
    // Raw body, not parsed JSON — see the note at the top of this file.
    express.raw({ type: 'application/json', limit: '1mb' }),
    async (req, res) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripeConfigured() || !secret) {
        console.error('[naction] Stripe webhook hit but STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET are not set.');
        res.status(503).json({ error: 'Stripe is not configured on this server.' });
        return;
      }

      const signature = req.headers['stripe-signature'];
      if (typeof signature !== 'string') {
        res.status(400).json({ error: 'Missing stripe-signature header.' });
        return;
      }

      let stripe: Stripe;
      try {
        stripe = await getStripe();
      } catch (err) {
        // The SDK is loaded lazily, so a missing package surfaces here rather
        // than taking the whole site down at boot. 503 makes Stripe retry, so
        // events are not lost once the install is fixed.
        console.error(`[naction] cannot load Stripe: ${err instanceof Error ? err.message : err}`);
        res.status(503).json({ error: 'Stripe is not available on this server.' });
        return;
      }

      let event: Stripe.Event;
      try {
        // Verifies the payload really came from Stripe and is recent. Without
        // this, anyone who knows the URL could activate memberships for free.
        event = stripe.webhooks.constructEvent(req.body as Buffer, signature, secret);
      } catch (err) {
        console.error(
          `[naction] Stripe signature verification failed: ${err instanceof Error ? err.message : err}`,
        );
        res.status(400).json({ error: 'Signature verification failed.' });
        return;
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed':
            await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
            break;
          case 'invoice.payment_failed':
            onPaymentFailed(event.data.object as Stripe.Invoice);
            break;
          case 'customer.subscription.deleted':
            await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
            break;
          default:
            // Everything else is noise for now; acknowledge so Stripe stops retrying.
            break;
        }
        res.json({ received: true });
      } catch (err) {
        // A 500 makes Stripe retry, which is what we want for a transient disk
        // error — the event is not lost.
        console.error(`[naction] error handling Stripe event ${event.type} (${event.id}):`, err);
        res.status(500).json({ error: 'Handler failed.' });
      }
    },
  );

  return router;
}
