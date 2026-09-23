import { useEffect, useState } from 'react';
import {
  consentRequired,
  loadAnalytics,
  readConsent,
  revokeAnalytics,
  trackingConfigured,
  writeConsent,
  type Consent,
} from '../lib/analytics';

/**
 * Consent gate for analytics cookies.
 *
 * Renders nothing in either of the two situations that currently apply:
 * no analytics configured at all, or analytics running cookie-free. Matomo is
 * configured for the latter, so today this banner never appears — which is the
 * point. There is nothing stored on the visitor's device to consent to, and no
 * reason to put a dialog in front of someone who has just been in a collision.
 *
 * It is kept rather than deleted because it is the safeguard that has to come
 * back the moment cookies do: flip COOKIE_FREE in lib/analytics.ts and this
 * banner returns automatically, gating the tracker behind an explicit opt-in.
 *
 * Accept and Decline carry equal visual weight, and the script only ever loads
 * on an explicit Accept, so this gates rather than merely informs.
 *
 * It carries its own scoped styles rather than taking design-system tokens, so
 * it renders identically on the site and on the standalone privacy page.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState<Consent | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!trackingConfigured()) return;
    // Cookie-free: start the tracker immediately, with no banner. Nothing is
    // written to the device, so there is nothing to ask permission for.
    if (!consentRequired()) {
      loadAnalytics();
      return;
    }
    const stored = readConsent();
    setChoice(stored);
    if (stored === 'accepted') loadAnalytics();
    setReady(true);
  }, []);

  if (!consentRequired() || !ready || choice !== null) return null;

  const decide = (consent: Consent) => {
    writeConsent(consent);
    setChoice(consent);
    if (consent === 'accepted') loadAnalytics();
    else revokeAnalytics();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="cc" role="dialog" aria-labelledby="cc-title" aria-describedby="cc-body">
        <div className="cc-text">
          <strong id="cc-title">Cookies</strong>
          <p id="cc-body">
            We'd like to set optional analytics cookies. Everything works either way.{' '}
            <a href="/privacy">Privacy policy</a>
          </p>
        </div>
        <div className="cc-actions">
          <button type="button" className="cc-btn" onClick={() => decide('declined')}>
            Decline
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={() => decide('accepted')}>
            Accept
          </button>
        </div>
      </div>
    </>
  );
}

/*
 * A slim full-width bar rather than a corner card: the zip search sits low on
 * the left of the hero, and a floating card there covered the zip input — the
 * one control someone who has just crashed needs to reach.
 */
const CSS = `
.cc {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  padding: 14px clamp(16px, 4vw, 40px);
  background: #fff;
  color: #101418;
  font: 400 14px/1.5 system-ui, -apple-system, sans-serif;
  border-top: 1px solid rgba(16,20,24,0.12);
  box-shadow: 0 -6px 28px rgba(0,0,0,0.12);
}
.cc-text { max-width: 720px; }
.cc-text strong { font-size: 14px; margin-right: 6px; }
.cc-text p { display: inline; margin: 0; color: #46535c; }
.cc-text a { color: #0b756c; text-decoration: underline; }
.cc-actions { display: flex; gap: 10px; flex: none; }
.cc-btn {
  padding: 10px 22px;
  border-radius: 999px;
  border: 1.5px solid rgba(16,20,24,0.18);
  background: #fff;
  color: #101418;
  font: 600 14px/1.2 system-ui, -apple-system, sans-serif;
  cursor: pointer;
  white-space: nowrap;
}
.cc-btn:hover { background: #f2f5f7; }
.cc-btn-primary { background: #101418; border-color: #101418; color: #fff; }
.cc-btn-primary:hover { background: #23292d; }
.cc-btn:focus-visible { outline: 2px solid #0d9488; outline-offset: 2px; }
@media (max-width: 760px) {
  .cc { justify-content: flex-start; gap: 12px; }
  .cc-actions { width: 100%; }
  .cc-btn { flex: 1; }
}
`;
