import Stripe from 'stripe';
import type { Tier } from './types.js';

/**
 * Stripe subscriptions for the paid membership tiers.
 *
 * Nothing here runs on the public site. Memberships are sold approve-first:
 * a business applies, you review them, and only then do you send a checkout
 * link. That keeps card handling on Stripe's own pages (so the site still
 * loads no third-party script and sets no cookies), and it means a slot is
 * never sold to someone you have not accepted — each tier exists once per
 * category, so a refund after the fact would also mean an awkward conversation.
 *
 * Configured entirely through environment variables:
 *
 *   STRIPE_SECRET_KEY        sk_test_… while testing, sk_live_… in production
 *   STRIPE_PRODUCT_PRIORITY  prod_… for Get Priority
 *   STRIPE_PRODUCT_FEATURED  prod_… for Get Featured
 *   STRIPE_PRODUCT_NETWORK   prod_… for Network Partner
 *   PUBLIC_URL               where Stripe returns the customer afterwards
 *
 * Products rather than prices on purpose: the price is read from each
 * product's default_price at checkout time, so changing what a tier costs is
 * a dashboard edit with no redeploy. Existing subscriptions keep the price
 * they signed up at — Stripe does not reprice them — which is what you want.
 */

const PRODUCT_ENV: Record<Tier, string> = {
  priority: 'STRIPE_PRODUCT_PRIORITY',
  featured: 'STRIPE_PRODUCT_FEATURED',
  network: 'STRIPE_PRODUCT_NETWORK',
};

let client: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set — cannot talk to Stripe.');
  }
  // No explicit apiVersion: the SDK pins the version it was built against, so
  // the two move together on upgrade instead of drifting apart.
  client = new Stripe(key);
  return client;
}

/** True when the configured key is a test key, so scripts can say so out loud. */
export function isTestMode(): boolean {
  return (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_');
}

function productIdFor(tier: Tier): string {
  const name = PRODUCT_ENV[tier];
  const id = process.env[name];
  if (!id) {
    throw new Error(`${name} is not set — cannot sell the ${tier} tier.`);
  }
  return id;
}

/** Resolved once per process; product → price rarely changes mid-run. */
const priceCache = new Map<Tier, Stripe.Price>();

/**
 * The price a tier currently sells at, from its product's default_price.
 *
 * Throws with an actionable message rather than a Stripe error code: a product
 * with no default price looks like a Stripe outage otherwise, when in fact it
 * needs one click in the dashboard.
 */
export async function priceForTier(tier: Tier): Promise<Stripe.Price> {
  const cached = priceCache.get(tier);
  if (cached) return cached;

  const productId = productIdFor(tier);
  const product = await getStripe().products.retrieve(productId, {
    expand: ['default_price'],
  });

  const price = product.default_price;
  if (!price || typeof price === 'string') {
    throw new Error(
      `Stripe product ${productId} (${tier}) has no default price. ` +
        'Open it in the Stripe dashboard, add a recurring monthly price, and set it as default.',
    );
  }
  if (!price.recurring) {
    throw new Error(
      `Stripe price ${price.id} for ${tier} is one-off, not recurring. ` +
        'Memberships are monthly subscriptions — add a recurring price to the product.',
    );
  }

  priceCache.set(tier, price);
  return price;
}

/** Human-readable amount, e.g. "$29.99/month", for confirming before sending a link. */
export function describePrice(price: Stripe.Price): string {
  const amount = price.unit_amount == null ? '?' : (price.unit_amount / 100).toFixed(2);
  const currency = (price.currency ?? 'usd').toUpperCase();
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  const interval = price.recurring?.interval ?? 'one-off';
  return `${symbol}${amount}/${interval}`;
}

export interface CheckoutRequest {
  tier: Tier;
  /** The partner record this membership will attach to, e.g. "tow-la-002". */
  partnerId: string;
  /** Shown on the Stripe page and used for the receipt. */
  email: string;
  businessName: string;
  category: string;
}

/**
 * A Stripe-hosted subscription checkout for one approved applicant.
 *
 * The returned URL is what you email them. It is good for 24 hours; after
 * that, generate another. Everything needed to activate the membership is
 * stamped into metadata, so the webhook never has to guess who paid for what.
 */
export async function createCheckoutSession(req: CheckoutRequest): Promise<Stripe.Checkout.Session> {
  const price = await priceForTier(req.tier);
  const base = (process.env.PUBLIC_URL ?? 'https://nactionadvisors.com').replace(/\/$/, '');

  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: req.email,
    success_url: `${base}/membership/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/#apply`,
    // Read back by the webhook to know which partner and tier were bought.
    metadata: {
      partnerId: req.partnerId,
      tier: req.tier,
      category: req.category,
      businessName: req.businessName,
    },
    subscription_data: {
      metadata: {
        partnerId: req.partnerId,
        tier: req.tier,
        category: req.category,
        businessName: req.businessName,
      },
    },
  });
}
