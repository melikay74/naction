#!/usr/bin/env node
/**
 * Mints a Stripe checkout link for an applicant you have approved.
 *
 *   npm run checkout-link -- --partner tow-la-002 --tier featured \
 *                            --email owner@example.com --name "Westside Tow"
 *
 * Prints a URL to paste into your approval email. Nothing about this touches
 * the public site: memberships are sold approve-first, so the link only exists
 * once you have decided to accept the business.
 *
 * Reads STRIPE_SECRET_KEY and the three STRIPE_PRODUCT_* ids from site/.env,
 * which is gitignored. Run it from the site/ directory.
 */
import { createCheckoutSession, describePrice, isTestMode, priceForTier, stripeConfigured } from '../server/dist/stripe.js';
import { loadPartners } from '../server/dist/partners.js';
import { MAX_PER_TIER, TIERS } from '../server/dist/types.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (!key) continue;
    args[key] = argv[i + 1];
  }
  return args;
}

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

const args = parseArgs(process.argv.slice(2));

if (!stripeConfigured()) {
  fail(
    'STRIPE_SECRET_KEY is not set.\n    Put it in site/.env (gitignored) and run with: npm run checkout-link -- …',
  );
}

const { partner: partnerId, tier, email, name } = args;
if (!partnerId || !tier || !email) {
  fail(
    'Missing arguments.\n' +
      '    Usage: npm run checkout-link -- --partner <id> --tier <network|featured|priority> \\\n' +
      '                                     --email <address> [--name "Business Name"]',
  );
}
if (!TIERS.includes(tier)) {
  fail(`Unknown tier "${tier}". Expected one of: ${TIERS.join(', ')}`);
}

// The partner has to exist before a membership can attach to it, and the slot
// has to be free — each tier is sold once per category, so selling a taken one
// would mean a refund and an awkward conversation.
const partners = await loadPartners();
const partner = partners.find((p) => p.id === partnerId);
if (!partner) {
  fail(`No partner with id "${partnerId}" in partners.json. Add the record first, untiered.`);
}

const holders = partners.filter((p) => p.category === partner.category && p.tier === tier);
const takenByOther = holders.filter((p) => p.id !== partnerId);
if (takenByOther.length >= MAX_PER_TIER) {
  fail(
    `The ${tier} slot for "${partner.category}" is already held by ` +
      `${takenByOther.map((p) => `${p.name} (${p.id})`).join(', ')}.\n` +
      `    Only ${MAX_PER_TIER} per tier per category. Cancel that membership before selling this one.`,
  );
}

const price = await priceForTier(tier);
const session = await createCheckoutSession({
  tier,
  partnerId,
  email,
  businessName: name || partner.name,
  category: partner.category,
});

console.log(`
  ${isTestMode() ? 'TEST MODE — no real money will move.' : '*** LIVE MODE — this charges a real card. ***'}

  Business   ${partner.name}  (${partnerId})
  Category   ${partner.category}
  Tier       ${tier} — ${describePrice(price)}
  Send to    ${email}

  Checkout link (valid 24 hours):

  ${session.url}

  Once they pay, set "tier": "${tier}" on ${partnerId} in partners.json.
`);
