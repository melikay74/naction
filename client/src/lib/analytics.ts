import { config } from '../config';

const STORAGE_KEY = 'naction.consent';

export type Consent = 'accepted' | 'declined';

/**
 * Whether anything on this site would set a cookie. With no analytics ID
 * configured the site is cookie-free, so there is nothing to ask about and the
 * banner never shows.
 */
export function trackingConfigured(): boolean {
  return typeof config.analyticsId === 'string' && config.analyticsId.length > 0;
}

/**
 * Remembering a consent choice is itself "strictly necessary" under the ePrivacy
 * rules — it is the record of the visitor's decision — so it is kept in
 * localStorage rather than a cookie, and holds nothing but the choice.
 */
export function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'accepted' || value === 'declined' ? value : null;
  } catch {
    // Private browsing or storage disabled — treat as undecided.
    return null;
  }
}

export function writeConsent(consent: Consent): void {
  try {
    localStorage.setItem(STORAGE_KEY, consent);
  } catch {
    // Nothing to do; the banner will simply ask again next visit.
  }
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

let loaded = false;

/**
 * Injects the analytics script. This is the ONLY place a tracking script may be
 * added — it is called solely after an explicit opt-in, which is what makes the
 * banner a real gate rather than a notice.
 */
export function loadAnalytics(): void {
  if (loaded || !trackingConfigured()) return;
  const id = config.analyticsId as string;
  loaded = true;

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(tag);

  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  }
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
}

/**
 * Best-effort teardown for a visitor who opts out after having opted in.
 * Removing the script cannot undo cookies already set, so clear those too.
 */
export function revokeAnalytics(): void {
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (!name || !/^(_ga|_gid|_gat)/.test(name)) continue;
    const base = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = base;
    document.cookie = `${base}; domain=${location.hostname}`;
    document.cookie = `${base}; domain=.${location.hostname}`;
  }
}
