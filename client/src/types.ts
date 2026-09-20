export const CATEGORIES = ['tow', 'repair', 'legal'] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  tow: 'Tow Truck Services',
  repair: 'Collision Repair Shops',
  legal: 'Personal Injury Attorneys',
};

/** Short form used inside the search form's segmented control. */
export const CATEGORY_SHORT_LABELS: Record<Category, string> = {
  tow: 'Towing',
  repair: 'Collision Repair',
  legal: 'Injury Attorney',
};

/** Paid membership tiers, best first. Mirrors the server's TIERS. */
export const TIERS = ['network', 'featured', 'priority'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  network: 'Network partner',
  featured: 'Featured partner',
  priority: 'Priority partner',
};

/** Social platforms a partner may list. Mirrors the server's SOCIALS. */
export const SOCIALS = ['instagram', 'facebook', 'x', 'tiktok', 'youtube', 'linkedin', 'yelp', 'google'] as const;
export type Social = (typeof SOCIALS)[number];

/**
 * A partner as the API sends it. The server only includes the fields a
 * partner's tier entitles — free: name, city, phone; priority: + address;
 * featured: + logo, website, two socials; network: + all socials — so the
 * card just renders whatever is present.
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
  /** URL path, e.g. /logos/tow-la-002.png */
  logo?: string;
  socials?: Partial<Record<Social, string>>;
}

export interface CategoryPage {
  /** Network Partners covering the area, shown in the band above the columns. */
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

export interface ApplicationInput {
  contactName: string;
  businessName: string;
  businessType: Category;
  phone: string;
  email: string;
  website: string;
  serviceArea: string;
  /** Honeypot — always empty for real visitors. */
  company_website_confirm: string;
}
