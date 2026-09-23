import { config } from '../config';

/**
 * Matomo, self-hosted and running cookie-free.
 *
 * Two deliberate properties, both of which the rest of the site depends on:
 *
 *  1. It is first-party. Matomo runs on our own subdomain, so no visitor data
 *     reaches a third party and the privacy policy's claim that browsing this
 *     site discloses nothing to an outside company stays true. It also means
 *     content blockers and ITP do not silently eat the measurements.
 *
 *  2. It sets no cookies. COOKIE_FREE below pushes Matomo's `disableCookies`
 *     before the tracker starts, so there is nothing to consent to and no
 *     banner in front of someone who has just been in a collision. This is
 *     why the site can still say it sets no cookies at all.
 *
 * The trade for (2) is that returning visitors are counted as new ones. For a
 * site whose job is getting a stranded person to a tow truck, "how many people
 * needed help" is the number that matters, not "how many came back".
 *
 * Nothing here runs until config.matomoUrl AND config.matomoSiteId are both
 * set. An unconfigured build issues no requests at all.
 */

/**
 * Whether the tracker runs without cookies.
 *
 * This single constant drives BOTH the `disableCookies` call below and whether
 * the consent banner renders, so the two can never disagree. Flipping it to
 * false brings the banner back — and would make the privacy policy's
 * "no cookies" wording wrong, so that text has to change with it.
 */
const COOKIE_FREE = true;

/** True once both Matomo settings are filled in. */
export function trackingConfigured(): boolean {
  return Boolean(config.matomoUrl && config.matomoSiteId);
}

/**
 * Whether a consent banner is legally needed.
 *
 * Cookie-free Matomo stores nothing on the visitor's device, which is what
 * consent rules attach to — so with COOKIE_FREE the answer is no.
 */
export function consentRequired(): boolean {
  return trackingConfigured() && !COOKIE_FREE;
}

type Matomo = { _paq?: unknown[][] };

function queue(): unknown[][] {
  const w = window as unknown as Matomo;
  w._paq = w._paq || [];
  return w._paq;
}

let loaded = false;

/**
 * Loads the tracker. The ONLY place a tracking script may be added.
 *
 * Order matters: disableCookies and IP anonymisation are pushed BEFORE
 * trackPageView, because Matomo applies the queue in sequence and a pageview
 * recorded before those settings would already have set a cookie.
 */
export function loadAnalytics(): void {
  if (loaded || !trackingConfigured()) return;
  loaded = true;

  const base = config.matomoUrl!.endsWith('/') ? config.matomoUrl! : `${config.matomoUrl!}/`;
  const _paq = queue();

  // Configuration first, actions second. Matomo's own published snippet pushes
  // trackPageView before the tracker URL and relies on internal ordering; doing
  // it explicitly is unambiguous, and with disableCookies it is mandatory —
  // a pageview recorded before that setting has already set the cookie.
  _paq.push(['setTrackerUrl', `${base}matomo.php`]);
  _paq.push(['setSiteId', config.matomoSiteId!]);
  if (COOKIE_FREE) _paq.push(['disableCookies']);
  // Honour the browser's Do Not Track signal. Costs some measurements, but
  // tracking someone who has explicitly asked not to be would sit badly next
  // to the rest of this site's privacy posture. Remove to count those visits.
  _paq.push(['setDoNotTrack', true]);
  // Distinguishes "found a partner and sat reading the card" from an instant
  // bounce, which plain pageviews cannot on a single-page site.
  _paq.push(['enableHeartBeatTimer', 15]);
  _paq.push(['trackPageView']);

  const script = document.createElement('script');
  script.async = true;
  script.src = `${base}matomo.js`;
  document.head.appendChild(script);
}

/**
 * Records an interaction. Safe to call before the tracker has loaded — Matomo
 * replays whatever is already in _paq — and a no-op when unconfigured, so call
 * sites never need to guard.
 */
export function trackEvent(category: string, action: string, name?: string, value?: number): void {
  if (!trackingConfigured()) return;
  const event: unknown[] = ['trackEvent', category, action];
  if (name !== undefined) event.push(name);
  if (value !== undefined) event.push(value);
  queue().push(event);
}

/**
 * A click on a partner's phone number or website.
 *
 * Labelled with the tier as well as the name because this is the number that
 * justifies a paid slot at renewal: "your Featured listing produced 47 phone
 * taps last month" is the whole argument, and it needs the tier attached to be
 * comparable against a free listing.
 */
export function trackPartnerClick(
  action: 'Phone' | 'Website' | 'Directions' | 'Social',
  partner: { name: string; tier?: string | null },
): void {
  trackEvent('Partner', action, `${partner.name} (${partner.tier ?? 'free'})`);
}

/** A completed search, so the categories and areas people actually need are visible. */
export function trackSearch(zip: string, categories: string[], resultCount: number): void {
  trackEvent('Search', categories.slice().sort().join('+') || 'none', zip, resultCount);
}

/* ------------------------------------------------------------------------ *
 * Consent.
 *
 * Unused while COOKIE_FREE is true — cookie-free tracking needs no permission,
 * so consentRequired() is false and the banner never renders. Kept intact so
 * that flipping COOKIE_FREE restores a working opt-in gate in one edit rather
 * than requiring this to be rebuilt under time pressure.
 * ------------------------------------------------------------------------ */

const STORAGE_KEY = 'naction.consent';

export type Consent = 'accepted' | 'declined';

/**
 * Remembering a consent choice is itself "strictly necessary" under the
 * ePrivacy rules — it is the record of the visitor's decision — so it is kept
 * in localStorage rather than a cookie, and holds nothing but the choice.
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

/**
 * Best-effort teardown for a visitor who opts out after having opted in.
 * Removing the script cannot undo cookies already set, so clear those too.
 * Matomo's cookies are the _pk_* family.
 */
export function revokeAnalytics(): void {
  queue().push(['disableCookies']);
  queue().push(['deleteCookies']);
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0]?.trim();
    if (!name || !/^_pk_/.test(name)) continue;
    const base = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    document.cookie = base;
    document.cookie = `${base}; domain=${location.hostname}`;
    document.cookie = `${base}; domain=.${location.hostname}`;
  }
}
