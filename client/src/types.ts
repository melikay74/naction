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
export const TIERS = ['platinum', 'gold', 'silver'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  platinum: 'Platinum partner',
  gold: 'Gold partner',
  silver: 'Silver partner',
};

export interface PartnerResult {
  id: string;
  category: Category;
  name: string;
  phone: string;
  tel: string;
  website?: string;
  city: string;
  tier?: Tier;
  note?: string;
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
