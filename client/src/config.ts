/**
 * PLACEHOLDERS — replace each value below with the real details before launch.
 * Everything the site publishes about the business lives here, so no other file
 * needs editing.
 */
export const config = {
  businessName: 'NAction Advisors LLC',
  tagline: 'Your first call after an accident.',

  /** Second line under the wordmark in the header. */
  brandTagline: 'Helping with Action',

  /** Published for BUSINESSES applying to join the network, not for victims. */
  partnerPhone: '(747) 895-9638',
  partnerPhoneHref: 'tel:+17478959638',

  email: 'art@nactionadvisors.com',
  website: 'www.nactionadvisors.com',
  websiteHref: 'https://www.nactionadvisors.com',

  /**
   * Drop a QR image at client/public/join-qr.png (linking to the site's #apply
   * anchor) and the placeholder frame is replaced automatically.
   */
  qrImage: '/join-qr.png',
  /** Drop a California service-area map at client/public/service-area.png. */
  serviceAreaImage: '/service-areas-2.jpg',

  /**
   * Self-hosted Matomo, running cookie-free.
   *
   * Both values come from Matomo → Administration → Websites → Manage, and the
   * tracker stays completely inert until BOTH are set — no script, no request,
   * no cookie. That is the safe default: an unconfigured build cannot leak a
   * visit anywhere.
   *
   *   matomoUrl:    'https://analytics.nactionadvisors.com/'   (trailing slash)
   *   matomoSiteId: '1'                                        (first site is 1)
   *
   * Self-hosted on our own subdomain on purpose: the data never reaches a third
   * party, so the privacy policy's promise that browsing this site discloses
   * nothing to an outside company stays literally true. Do not point this at a
   * hosted analytics service without rewriting that policy.
   *
   * Never load a tracking script outside lib/analytics.ts.
   */
  matomoUrl: 'https://analytics.nactionadvisors.com/' as string | null,
  matomoSiteId: '1' as string | null,

  /** Last substantive change to the privacy policy, shown on /privacy. */
  privacyUpdated: 'September 23, 2026',
} as const;
