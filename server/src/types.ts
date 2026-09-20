import type { Region } from './regions.js';

export const CATEGORIES = ['tow', 'repair', 'legal'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/**
 * Paid membership tiers, best first. Each tier is sold once per category —
 * one Network Partner, one Featured, one Priority for towing, repair and legal,
 * nine slots statewide. See enforceTierCaps in partners.ts.
 */
export const TIERS = ['network', 'featured', 'priority'] as const;
export type Tier = (typeof TIERS)[number];

export const MAX_PER_TIER = 1;

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value);
}

/** Social platforms a partner may list. Mirrors the client's SOCIALS. */
export const SOCIALS = ['instagram', 'facebook', 'x', 'tiktok', 'youtube', 'linkedin', 'yelp', 'google'] as const;
export type Social = (typeof SOCIALS)[number];

export interface Partner {
  id: string;
  category: Category;
  name: string;
  phone: string;
  website?: string;
  city: string;
  /** Exact zips this partner explicitly serves — ranked above a region match. */
  zips?: string[];
  regions?: Region[];
  statewide?: boolean;
  /** Paid membership. Promotes the partner in results — see rankedMatches. */
  tier?: Tier;
  /** One line, rendered verbatim: "1234 W Pico Blvd, Los Angeles, CA 90015". Shown from Priority up. */
  address?: string;
  /** Filename under data/logos/, e.g. "tow-la-002.png". Shown from Featured up. */
  logo?: string;
  /**
   * Platform → bare handle, or a full https:// URL for platforms without
   * handle-shaped links (Yelp, Google). Key order is display order: a Featured
   * partner shows the first two, a Network Partner all of them.
   */
  socials?: Partial<Record<Social, string>>;
  /** Placeholder record shipped with the repo, not a real business. */
  seed?: boolean;
  note?: string;
}

/**
 * A partner as sent to the client. Deliberately NOT `extends Partner`: only the
 * fields a partner's tier entitles are copied across — see toResult — so a
 * street address typed into a free listing never reaches the page.
 */
export interface PartnerResult {
  id: string;
  category: Category;
  name: string;
  city: string;
  phone: string;
  tel: string;
  tier?: Tier;
  note?: string;
  match: 'zip' | 'region' | 'statewide';
  address?: string;
  website?: string;
  /** Already a URL path (/logos/…), never a bare filename. */
  logo?: string;
  socials?: Partial<Record<Social, string>>;
}

export interface CategoryPage {
  /**
   * Network Partners that cover the searched area, pulled out of `items` so the
   * client can show them in the full-width band. Empty on load-more pages.
   */
  spotlight: PartnerResult[];
  items: PartnerResult[];
  total: number;
  hasMore: boolean;
}

export interface PartnerSearchResponse {
  zip: string;
  regionLabel: string;
  results: Partial<Record<Category, CategoryPage>>;
}

export interface Application {
  id: string;
  submittedAt: string;
  contactName: string;
  businessName: string;
  businessType: Category;
  phone: string;
  email: string;
  website: string;
  serviceArea: string;
}
