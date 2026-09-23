#!/usr/bin/env node
/**
 * Confirms the Stripe account and the three membership products are set up
 * the way the site expects. Run this before anything else — a product with no
 * default price, or a one-off price where a subscription was meant, surfaces
 * here as one sentence instead of as a failed checkout later.
 *
 *   npm run stripe:check
 *
 * Reads site/.env (gitignored). Makes only read calls; charges nothing.
 */
import { describePrice, getStripe, isTestMode, priceForTier, stripeConfigured } from '../server/dist/stripe.js';
import { TIERS } from '../server/dist/types.js';

if (!stripeConfigured()) {
  console.error(`
  ✗ STRIPE_SECRET_KEY is not set.

    Create site/.env (it is gitignored) containing:

      STRIPE_SECRET_KEY=sk_test_...
      STRIPE_PRODUCT_PRIORITY=prod_...
      STRIPE_PRODUCT_FEATURED=prod_...
      STRIPE_PRODUCT_NETWORK=prod_...
`);
  process.exit(1);
}

console.log(`\n  Mode: ${isTestMode() ? 'TEST' : '*** LIVE ***'}\n`);

let account;
try {
  account = await getStripe().accounts.retrieve();
} catch (err) {
  console.error(`  ✗ Could not reach Stripe: ${err.message}\n`);
  process.exit(1);
}
console.log(`  Account: ${account.settings?.dashboard?.display_name ?? account.id}`);
console.log(`  Country: ${account.country}   Charges enabled: ${account.charges_enabled ? 'yes' : 'NO'}\n`);

let failures = 0;
for (const tier of TIERS) {
  try {
    const price = await priceForTier(tier);
    console.log(`  ✓ ${tier.padEnd(9)} ${describePrice(price).padEnd(14)} ${price.id}`);
  } catch (err) {
    failures += 1;
    console.log(`  ✗ ${tier.padEnd(9)} ${err.message}`);
  }
}

if (!account.charges_enabled) {
  console.log(
    '\n  ! Charges are not enabled on this account yet. Test mode still works;\n' +
      '    live payments need the account details completed in the dashboard.',
  );
}

console.log(
  failures === 0
    ? '\n  All three tiers are ready to sell.\n'
    : `\n  ${failures} tier(s) need attention before they can be sold.\n`,
);
process.exit(failures === 0 ? 0 : 1);
