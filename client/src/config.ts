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
   * Google Analytics measurement ID, e.g. 'G-XXXXXXXXXX'.
   *
   * Leave null and the site sets NO cookies at all — and the consent banner
   * stays hidden, because there is nothing to consent to. Set it and the banner
   * appears, gating the analytics script behind an explicit opt-in.
   *
   * Never load a tracking script outside lib/analytics.ts, or consent stops
   * meaning anything.
   */
  analyticsId: null as string | null,

  /** Last substantive change to the privacy policy, shown on /privacy. */
  privacyUpdated: 'August 13, 2026',
} as const;
