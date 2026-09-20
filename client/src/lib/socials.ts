import type { Social } from '../types';

export const SOCIAL_LABELS: Record<Social, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  yelp: 'Yelp',
  google: 'Google',
};

/** Where a bare handle lives on each platform. Yelp and Google have no handle form. */
const PROFILE_URL: Record<Social, (handle: string) => string> = {
  instagram: (h) => `https://www.instagram.com/${h}/`,
  facebook: (h) => `https://www.facebook.com/${h}`,
  x: (h) => `https://x.com/${h}`,
  tiktok: (h) => `https://www.tiktok.com/@${h}`,
  youtube: (h) => `https://www.youtube.com/@${h}`,
  linkedin: (h) => `https://www.linkedin.com/company/${h}`,
  yelp: (h) => `https://www.yelp.com/biz/${h}`,
  google: (h) => `https://www.google.com/maps/search/${encodeURIComponent(h)}`,
};

/**
 * Resolves what the operator typed into a profile URL. A full https:// URL is
 * used as-is; a handle (with or without a leading @) becomes the platform's
 * profile URL.
 */
export function socialUrl(platform: Social, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return PROFILE_URL[platform](value.replace(/^@/, ''));
}

/** Display form of a website URL: no scheme, no trailing slash. */
export function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
}
