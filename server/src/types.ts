import type { Region } from './regions.js';

export const CATEGORIES = ['tow', 'repair', 'legal'] as const;
export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

/**
 * Paid membership tiers, best first. Capped at MAX_PER_TIER partners per tier
 * per category — see enforceTierCaps in partners.ts.
 */
export const TIERS = ['platinum', 'gold', 'silver'] as const;
export type Tier = (typeof TIERS)[number];

export const MAX_PER_TIER = 3;

export function isTier(value: unknown): value is Tier {
  return typeof value === 'string' && (TIERS as readonly string[]).includes(value);
}

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
  /** Placeholder record shipped with the repo, not a real business. */
  seed?: boolean;
  note?: string;
}

/** A partner as sent to the client — adds the tel: href and match reason. */
export interface PartnerResult extends Partner {
  tel: string;
  match: 'zip' | 'region' | 'statewide';
}

export interface CategoryPage {
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
