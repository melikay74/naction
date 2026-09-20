import type { PartnerResult } from '../types';

/** vCard 3.0 requires backslash-escaping of these in text values. */
function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/[;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

/**
 * A vCard for the partner — what the spotlight QR encodes, and what "Save
 * contact" downloads on a phone. ADR keeps the whole address in the street
 * slot: the record stores it as one line and contacts apps render it as such.
 */
export function partnerVCard(partner: PartnerResult): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${esc(partner.name)}`,
    `ORG:${esc(partner.name)}`,
    `TEL;TYPE=WORK,VOICE:${partner.tel.replace(/^tel:/, '')}`,
  ];
  if (partner.address) lines.push(`ADR;TYPE=WORK:;;${esc(partner.address)};;;;`);
  if (partner.website) lines.push(`URL:${partner.website}`);
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}

/** A data: URL for the vCard so a plain <a download> can hand it to the phone. */
export function vCardHref(partner: PartnerResult): string {
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(partnerVCard(partner))}`;
}
