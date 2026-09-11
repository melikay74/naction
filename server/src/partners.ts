import fs from 'node:fs/promises';
import { PARTNERS_FILE } from './paths.js';
import { regionForZip } from './regions.js';
import { MAX_PER_TIER, TIERS, isTier } from './types.js';
import type { Category, CategoryPage, Partner, PartnerResult, Tier } from './types.js';

let cache: { partners: Partner[]; mtimeMs: number } | null = null;

/**
 * Read the directory, re-reading only when the file changes on disk so the
 * JSON can be edited without restarting the server.
 */
export async function loadPartners(): Promise<Partner[]> {
  let stat;
  try {
    stat = await fs.stat(PARTNERS_FILE);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      // The most common production failure: NACTION_DATA_DIR points somewhere
      // the file was never uploaded. Name the path so the log answers the
      // question instead of raising it.
      throw new Error(
        `Partner directory not found at ${PARTNERS_FILE}. ` +
          (process.env.NACTION_DATA_DIR
            ? `NACTION_DATA_DIR is set to "${process.env.NACTION_DATA_DIR}" — make sure partners.json ` +
              'has actually been uploaded into that folder.'
            : 'NACTION_DATA_DIR is not set, so this falls back to the app\'s own data/ folder.'),
      );
    }
    throw err;
  }
  if (cache && cache.mtimeMs === stat.mtimeMs) return cache.partners;

  const raw = await fs.readFile(PARTNERS_FILE, 'utf8');
  const parsed = JSON.parse(raw) as { partners: Partner[] };
  if (!Array.isArray(parsed.partners)) {
    throw new Error('partners.json must contain a "partners" array');
  }
  const partners = enforceTierCaps(parsed.partners);
  cache = { partners, mtimeMs: stat.mtimeMs };
  return partners;
}

/**
 * Only MAX_PER_TIER partners may hold a given tier within a category. Anything
 * beyond that — or an unrecognised tier value — is demoted to untiered and
 * reported loudly.
 *
 * Deliberately not thrown: refusing to serve because someone oversold a tier
 * would take down a site whose job is reaching people after a crash. The
 * warning is what the operator acts on; the extras simply rank normally until
 * the file is fixed.
 */
function enforceTierCaps(partners: Partner[]): Partner[] {
  const counts = new Map<string, number>();

  return partners.map((partner) => {
    if (partner.tier === undefined) return partner;

    if (!isTier(partner.tier)) {
      console.warn(
        `[naction] partner "${partner.id}" has unknown tier ${JSON.stringify(partner.tier)} ` +
          `(expected ${TIERS.join(' or ')}) — ignoring it.`,
      );
      return { ...partner, tier: undefined };
    }

    const key = `${partner.category}/${partner.tier}`;
    const seen = (counts.get(key) ?? 0) + 1;
    counts.set(key, seen);

    if (seen > MAX_PER_TIER) {
      console.warn(
        `[naction] "${partner.id}" is ${partner.tier} #${seen} for category "${partner.category}", ` +
          `over the limit of ${MAX_PER_TIER} — showing it as untiered. ` +
          `Fix data/partners.json so only ${MAX_PER_TIER} keep this tier.`,
      );
      return { ...partner, tier: undefined };
    }

    return partner;
  });
}

/** Proximity bands, closest first. Distinct from a partner's membership tier. */
const BAND = { zip: 0, region: 1, statewide: 2 } as const;

/** Membership rank, best first. Untiered partners sort after every tier. */
const TIER_RANK: Record<Tier, number> = { platinum: 0, gold: 1, silver: 2 };
const tierRank = (tier: Tier | undefined): number => (tier ? TIER_RANK[tier] : TIERS.length);

/**
 * Whether a partner's paid tier earns it promotion above the proximity order.
 *
 * Only sponsors that actually cover the searched area qualify. A statewide-only
 * sponsor keeps its badge but stays in normal proximity order, so it can never
 * outrank a partner that genuinely serves the caller's zip — someone stranded
 * after a crash should not be routed past a closer option.
 */
function isPromoted(partner: PartnerResult): boolean {
  return partner.tier !== undefined && (partner.match === 'zip' || partner.match === 'region');
}

function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `tel:+1${digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits}`;
}

/**
 * Everything in `category` that serves `zip`, best first.
 *
 * Two orderings combine. Paid sponsors that actually cover the area lead the
 * column, gold before silver. Everyone else follows by proximity — an explicit
 * zip listing, then a region match, then statewide — with tier only breaking
 * ties inside a band. A statewide-only sponsor therefore keeps its badge but
 * never outranks a partner that truly serves the caller's zip.
 *
 * The order is total and stable, so paging with offset never repeats or skips.
 */
function rankedMatches(partners: Partner[], category: Category, zip: string): PartnerResult[] {
  const region = regionForZip(zip);

  const matched: PartnerResult[] = [];
  for (const partner of partners) {
    if (partner.category !== category) continue;

    let match: PartnerResult['match'] | null = null;
    if (partner.zips?.includes(zip)) match = 'zip';
    else if (region && partner.regions?.includes(region)) match = 'region';
    else if (partner.statewide) match = 'statewide';
    if (!match) continue;

    matched.push({ ...partner, tel: toTel(partner.phone), match });
  }

  matched.sort((a, b) => {
    // Sponsors covering this area lead the column.
    const promotedA = isPromoted(a);
    const promotedB = isPromoted(b);
    if (promotedA !== promotedB) return promotedA ? -1 : 1;

    if (promotedA) {
      // Inside the sponsored block: platinum, gold, silver, then closest, then name.
      return (
        tierRank(a.tier) - tierRank(b.tier) ||
        BAND[a.match] - BAND[b.match] ||
        a.name.localeCompare(b.name)
      );
    }

    // Everyone else: proximity decides, and tier only breaks ties inside a band
    // — so a statewide sponsor never displaces a genuinely local partner.
    return (
      BAND[a.match] - BAND[b.match] ||
      tierRank(a.tier) - tierRank(b.tier) ||
      a.name.localeCompare(b.name)
    );
  });

  return matched;
}

export async function searchPartners(
  zip: string,
  categories: Category[],
  limit: number,
  offset: number,
): Promise<Partial<Record<Category, CategoryPage>>> {
  const partners = await loadPartners();
  const results: Partial<Record<Category, CategoryPage>> = {};

  for (const category of categories) {
    const all = rankedMatches(partners, category, zip);
    const items = all.slice(offset, offset + limit);
    results[category] = {
      items,
      total: all.length,
      hasMore: offset + items.length < all.length,
    };
  }

  return results;
}
