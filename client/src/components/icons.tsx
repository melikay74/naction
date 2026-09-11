import type { Category } from '../types';

const shared = {
  viewBox: '0 0 28 28',
  width: 30,
  height: 30,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  'aria-hidden': true,
} as const;

/** Line-art category marks, matching the design system's wireframe weight. */
export const CATEGORY_ICONS: Record<Category, () => JSX.Element> = {
  tow: () => (
    <svg {...shared}>
      <rect x="2" y="12" width="14" height="7" rx="0.5" />
      <path d="M16 12 L21 12 L25 16 L25 19 L16 19 Z" />
      <circle cx="8" cy="21" r="2.2" />
      <circle cx="20" cy="21" r="2.2" />
      <line x1="4" y1="12" x2="4" y2="8" />
      <line x1="4" y1="8" x2="9" y2="8" />
    </svg>
  ),
  repair: () => (
    <svg {...shared}>
      <path d="M17 4 L21 8 L10 19 L5 20 L6 15 Z" />
      <line x1="14.5" y1="6.5" x2="18.5" y2="10.5" />
    </svg>
  ),
  legal: () => (
    <svg {...shared}>
      <line x1="14" y1="3" x2="14" y2="22" />
      <line x1="5" y1="7" x2="23" y2="7" />
      <path d="M5 7 L2 14 A4 4 0 0 0 10 14 Z" />
      <path d="M23 7 L20 14 A4 4 0 0 0 28 14 Z" />
      <line x1="9" y1="25" x2="19" y2="25" />
    </svg>
  ),
};
