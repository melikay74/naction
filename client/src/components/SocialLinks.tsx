import { socialUrl, SOCIAL_LABELS } from '../lib/socials';
import type { PartnerResult, Social } from '../types';

/**
 * Simple filled glyphs, drawn to read at 20px rather than as brand-accurate
 * logos. Icons are the only visible content, so each link names the platform
 * for screen readers and in its tooltip.
 */
const GLYPHS: Record<Social, JSX.Element> = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.3" cy="6.7" r="1.2" />
    </>
  ),
  facebook: <path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.3-.8.5-.8Z" />,
  x: <path d="M4 3h4.3l4.2 5.9L17.4 3H20l-6.3 7.4L20.5 21h-4.3l-4.5-6.3L6.3 21H3.7l6.8-7.9Z" />,
  tiktok: (
    <path d="M13.5 3h3c.2 2 1.5 3.5 3.5 3.8v3c-1.3 0-2.5-.4-3.5-1.1v6.1a5.2 5.2 0 1 1-5.2-5.2c.3 0 .6 0 .9.1v3.1a2.2 2.2 0 1 0 1.3 2V3Z" />
  ),
  youtube: (
    <path d="M21.5 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.7.4A2.5 2.5 0 0 0 2.5 7.2C2 8.7 2 12 2 12s0 3.3.5 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.7-.4a2.5 2.5 0 0 0 1.8-1.8c.5-1.5.5-4.8.5-4.8s0-3.3-.5-4.8ZM10 15V9l5.2 3L10 15Z" />
  ),
  linkedin: (
    <path d="M6.5 9H3.5v12h3V9ZM5 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6ZM20.5 13.6c0-3-1.6-4.9-4.3-4.9-1.6 0-2.6.8-3.1 1.6V9H10v12h3.1v-6c0-1.6.8-2.5 2.1-2.5s1.9.9 1.9 2.5v6h3.4v-7.4Z" />
  ),
  yelp: (
    <path d="M11.2 3.2c.3-.6 1.2-.7 1.6-.1l.1.2 1.6 6.2c.2.9-.9 1.5-1.5.8L9 6.1c-.4-.5-.3-1.2.3-1.5l1.9-1.4ZM8.3 9.6l4.3 3.1c.7.5.4 1.6-.5 1.7l-6.4.7c-.7.1-1.2-.5-1.1-1.2l.5-2.4c.2-.7.5-1.3.9-1.8.5-.6 1.5-.7 2.3-.1Zm5.6 6.2 4.9-2.6c.8-.4 1.6.2 1.4 1.1l-.6 2.3c-.2.7-.9 1.1-1.6.8L14 15.8c-.7-.3-.7-1.4-.1-1.9v1.9Zm-1.3 1.6 2.5 5.2c.4.8-.4 1.6-1.2 1.3l-2.2-.9c-.7-.3-1-1.1-.6-1.7l1.5-3.9Zm5.5-8.6-4.1 2.9c-.7.5-1.6-.2-1.3-1l1.6-6.2c.2-.8 1.2-1 1.7-.4l1.7 1.6c.5.5.6 1.4.4 3.1Z" />
  ),
  google: (
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
  ),
};

/** The partner's social profiles as icon links, in the order the record lists them. */
export function SocialLinks({ socials }: { socials: NonNullable<PartnerResult['socials']> }) {
  const entries = Object.entries(socials) as [Social, string][];
  if (entries.length === 0) return null;

  return (
    <ul className="social-links" aria-label="Social profiles">
      {entries.map(([platform, value]) => (
        <li key={platform}>
          <a
            href={socialUrl(platform, value)}
            target="_blank"
            rel="noopener noreferrer"
            title={SOCIAL_LABELS[platform]}
            aria-label={SOCIAL_LABELS[platform]}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              {GLYPHS[platform]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
