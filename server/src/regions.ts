/**
 * California zip -> service region.
 *
 * Extends the prefix idea from the original Claude Design prototype into full
 * statewide coverage. Ranges are on the 3-digit prefix, which is how USPS
 * allocates zips geographically, so a range check is stable as new 5-digit
 * zips are added within a prefix.
 */

export const REGIONS = ['LA', 'SD', 'IE', 'CENTRAL', 'BAY', 'SAC', 'NORTH'] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_LABELS: Record<Region, string> = {
  LA: 'the Los Angeles area',
  SD: 'the San Diego & Orange County area',
  IE: 'the Inland Empire',
  CENTRAL: 'the Central Coast & Central Valley',
  BAY: 'the SF Bay Area',
  SAC: 'the Sacramento area',
  NORTH: 'Northern California',
};

/** Inclusive 3-digit-prefix ranges, checked in order. */
const PREFIX_RANGES: Array<{ from: number; to: number; region: Region }> = [
  { from: 900, to: 918, region: 'LA' },
  { from: 919, to: 921, region: 'SD' },
  { from: 922, to: 923, region: 'IE' },
  { from: 924, to: 925, region: 'IE' },
  { from: 926, to: 928, region: 'SD' }, // Orange County
  { from: 930, to: 935, region: 'CENTRAL' },
  { from: 936, to: 939, region: 'CENTRAL' },
  { from: 940, to: 949, region: 'BAY' },
  { from: 950, to: 951, region: 'BAY' }, // San Jose / Santa Clara
  { from: 952, to: 953, region: 'SAC' },
  { from: 954, to: 954, region: 'NORTH' },
  { from: 955, to: 956, region: 'NORTH' },
  { from: 957, to: 958, region: 'SAC' },
  { from: 959, to: 961, region: 'NORTH' },
];

/** Californian zips run 90001-96162. */
export function isCaliforniaZip(zip: string): boolean {
  if (!/^\d{5}$/.test(zip)) return false;
  const n = Number(zip);
  return n >= 90001 && n <= 96162;
}

/**
 * Region for a California zip, or null if the zip is not in California.
 * Never throws — callers validate first via isCaliforniaZip.
 */
export function regionForZip(zip: string): Region | null {
  if (!isCaliforniaZip(zip)) return null;
  const prefix = Number(zip.slice(0, 3));
  const match = PREFIX_RANGES.find((r) => prefix >= r.from && prefix <= r.to);
  // 929 and 962-966 are unallocated/military; fall back to the nearest broad
  // region rather than dropping the visitor into a statewide-only result.
  return match ? match.region : 'CENTRAL';
}

export function regionLabelForZip(zip: string): string {
  const region = regionForZip(zip);
  return region ? REGION_LABELS[region] : 'California';
}
