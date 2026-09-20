import { useEffect, useState } from 'react';
import { partnerVCard } from '../lib/vcard';
import type { PartnerResult } from '../types';

/**
 * A QR code holding the partner's vCard. Scanning it on a phone offers
 * "Add contact" with the name, phone, address and website — a fair trade for
 * someone reading a desktop or a friend's screen after a crash.
 *
 * The encoder is loaded on demand: it only ever runs for Network Partners, so
 * the rest of the page should not pay for it.
 */
export function ContactQr({ partner }: { partner: PartnerResult }) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('qrcode')
      .then((QRCode) =>
        QRCode.toString(partnerVCard(partner), {
          type: 'svg',
          errorCorrectionLevel: 'M',
          margin: 1,
          color: { dark: '#0b1f2a', light: '#ffffff' },
        }),
      )
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        // No QR is better than a broken card; the phone link still works.
      });
    return () => {
      cancelled = true;
    };
  }, [partner]);

  if (!svg) return null;

  return (
    <figure className="contact-qr">
      <div
        className="contact-qr-code"
        role="img"
        aria-label={`QR code: save ${partner.name} as a contact`}
        // Markup is generated locally by the qrcode library from our own data — never from the network.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>Scan to save contact</figcaption>
    </figure>
  );
}
