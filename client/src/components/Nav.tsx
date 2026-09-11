import { useState } from 'react';
import { config } from '../config';

const LINKS = [
  { href: '#find-help', label: 'Find help' },
  { href: '#services', label: 'Services' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#faq', label: 'FAQ' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav className="nav site-nav">
      <a className="nav-brand brand" href="#top" onClick={close}>
        <img className="brand-logo" src="/logo.png" alt="" width={52} height={52} />
        <span className="brand-text">
          <span className="brand-name">{config.businessName.replace(' LLC', '')}</span>
          <span className="brand-tagline">{config.brandTagline}</span>
        </span>
      </a>

      <div className={`site-nav-links${open ? ' is-open' : ''}`} id="site-nav-links">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} onClick={close}>
            {link.label}
          </a>
        ))}
        <a href="#apply" className="btn btn-secondary" onClick={close}>
          Become a partner
        </a>
      </div>

      <button
        type="button"
        className="site-nav-toggle btn btn-secondary"
        aria-label="Toggle menu"
        aria-expanded={open}
        aria-controls="site-nav-links"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </nav>
  );
}
