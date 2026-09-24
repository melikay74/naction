import express from 'express';
import { getStripe, stripeConfigured } from './stripe.js';
import { isTier } from './types.js';

/**
 * Read-only lookup for the post-checkout thank-you page.
 *
 * Stripe sends the customer to /membership/thanks?session_id=cs_… and that page
 * asks this endpoint what was actually bought, so the confirmation shows real
 * details rather than a generic message that would appear even if the payment
 * had failed.
 *
 * Three things keep this safe to expose without authentication:
 *
 *  1. The session id is the capability. It is a long unguessable string that
 *     only reaches the person Stripe redirected, and Stripe's own documented
 *     pattern for success pages is exactly this lookup.
 *  2. Only a whitelist of fields is returned — business name, tier, amount.
 *     Never the customer id, the payment method, or anything Stripe holds that
 *     the buyer did not type into our own form.
 *  3. Unpaid sessions report status only. An abandoned checkout cannot be made
 *     to look like a completed one.
 *
 * It is deliberately NOT how a membership gets activated — the webhook does
 * that, server to server, because a customer who closes the tab before the
 * redirect must still end up with what they paid for.
 */

export interface MembershipSummary {
  paid: boolean;
  businessName?: string;
  tier?: string;
  amount?: string;
  email?: string;
}

function money(amount: number | null | undefined, currency: string | undefined): string | undefined {
  if (amount == null) return undefined;
  const code = (currency ?? 'usd').toLowerCase();
  const symbol = code === 'usd' ? '$' : `${code.toUpperCase()} `;
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

export function membership(): express.Router {
  const router = express.Router();

  router.get('/api/membership/session', async (req, res) => {
    const id = req.query.id;

    // Checkout session ids are always cs_…; rejecting anything else here means
    // arbitrary strings never reach Stripe as a lookup.
    if (typeof id !== 'string' || !/^cs_[A-Za-z0-9_]{10,200}$/.test(id)) {
      res.status(400).json({ error: 'A valid Stripe session id is required.' });
      return;
    }

    if (!stripeConfigured()) {
      // Not an error the visitor can act on, and the page falls back to a
      // generic confirmation, so this stays quiet.
      res.status(503).json({ error: 'Stripe is not configured on this server.' });
      return;
    }

    try {
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(id);
      const paid = session.payment_status === 'paid';

      if (!paid) {
        res.json({ paid: false } satisfies MembershipSummary);
        return;
      }

      const tier = session.metadata?.tier;
      res.json({
        paid: true,
        businessName: session.metadata?.businessName,
        tier: isTier(tier) ? tier : undefined,
        amount: money(session.amount_total, session.currency ?? undefined),
        email: session.customer_details?.email ?? undefined,
      } satisfies MembershipSummary);
    } catch (err) {
      // A bad id, a session from a different account, or the SDK missing — the
      // visitor has already paid either way, so the page shows its generic
      // confirmation rather than an alarming error.
      console.error(`[naction] could not look up checkout session: ${err instanceof Error ? err.message : err}`);
      res.status(404).json({ error: 'That checkout session could not be found.' });
    }
  });

  return router;
}
