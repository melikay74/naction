import { useEffect, useState } from 'react';
import { config } from '../config';
import { TIER_LABELS } from '../types';
import type { Tier } from '../types';

/**
 * Where Stripe sends someone after a successful checkout.
 *
 * Two jobs, in this order of importance:
 *
 *  1. Confirm the money went through, with real figures rather than a generic
 *     "thanks" that would look identical if it had not.
 *  2. Set expectations about what happens next. Activation is deliberately
 *     manual — a webhook never edits the partner directory — so a listing does
 *     NOT appear the moment the card clears. Saying so here is the difference
 *     between a customer waiting patiently and one emailing within the hour
 *     asking why they cannot find themselves.
 *
 * The page renders its confirmation even when the lookup fails. They have
 * already paid at that point, and showing them an error because our own API
 * had a problem would be alarming for no reason.
 */

interface Summary {
  paid: boolean;
  businessName?: string;
  tier?: string;
  amount?: string;
  email?: string;
}

/**
 * 'none' is distinct from a failed lookup on purpose. Arriving with no session
 * id at all is not evidence of a payment — anyone can type this URL — so that
 * case must never render a confirmation. A lookup that fails WITH a session id
 * is different: Stripe sent them, so they have paid, and our own API being
 * unavailable is not their problem.
 */
type State = { status: 'loading' } | { status: 'none' } | { status: 'done'; summary: Summary | null };

function sessionIdFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('session_id');
}

export function MembershipThanks() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    // A transactional page has no business in search results, and it answers
    // 200 for any visitor, so keep it out of the index explicitly.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    const id = sessionIdFromUrl();
    if (!id) {
      setState({ status: 'none' });
      return () => meta.remove();
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/membership/session?id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error(String(response.status));
        const summary = (await response.json()) as Summary;
        if (!cancelled) setState({ status: 'done', summary });
      } catch {
        // Fall back to the generic confirmation — see the note above.
        if (!cancelled) setState({ status: 'done', summary: null });
      }
    })();

    return () => {
      cancelled = true;
      meta.remove();
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="mt">
        <style>{CSS}</style>
        <div className="mt-card">
          <p className="mt-loading">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  // Reached without a session id — no payment to confirm, so say nothing that
  // implies one. Most likely a bookmark, a shared link, or a crawler.
  if (state.status === 'none') {
    return (
      <div className="mt">
        <style>{CSS}</style>
        <div className="mt-card">
          <a className="mt-back" href="/">
            ← Back to {config.businessName.replace(' LLC', '')}
          </a>
          <h1>Nothing to confirm here</h1>
          <p className="mt-lede">
            This page confirms a membership payment, and it was opened without one. If you have just
            paid, use the link Stripe sent you back to — it carries your receipt details.
          </p>
          <p className="mt-lede">
            Interested in joining the network?{' '}
            <a href="/#apply">See the membership tiers</a>.
          </p>
          <p className="mt-contact">
            Questions? Email <a href={`mailto:${config.email}`}>{config.email}</a> or call{' '}
            <a href={config.partnerPhoneHref}>{config.partnerPhone}</a>.
          </p>
        </div>
      </div>
    );
  }

  const summary = state.summary;
  // An abandoned checkout can reach this URL by going back in the browser.
  const abandoned = summary?.paid === false;
  const tierLabel =
    summary?.tier && summary.tier in TIER_LABELS ? TIER_LABELS[summary.tier as Tier] : null;

  return (
    <div className="mt">
      <style>{CSS}</style>
      <div className="mt-card">
        <a className="mt-back" href="/">
          ← Back to {config.businessName.replace(' LLC', '')}
        </a>

        {abandoned ? (
          <>
            <h1>Checkout not completed</h1>
            <p className="mt-lede">
              It looks like that checkout was not finished, so nothing has been charged. If you meant to
              complete it, use the link we sent you — or reply to that email and we will send a new one.
            </p>
          </>
        ) : (
          <>
            <div className="mt-tick" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1>Thank you — your membership is confirmed</h1>
            <p className="mt-lede">
              {summary?.businessName ? (
                <>
                  We have received your payment for <strong>{summary.businessName}</strong>
                  {tierLabel && <> — {tierLabel}</>}
                  {summary.amount && <> at {summary.amount}/month</>}.
                </>
              ) : (
                <>We have received your payment and your membership is active.</>
              )}
            </p>

            {summary?.email && (
              <p className="mt-receipt">
                Stripe has emailed a receipt to <strong>{summary.email}</strong>.
              </p>
            )}

            <h2>What happens next</h2>
            <ol className="mt-steps">
              <li>
                <strong>We set your listing live.</strong> This is done by hand, usually within one
                business day — we check the details before publishing rather than letting a payment
                publish them automatically.
              </li>
              <li>
                <strong>You will hear from us by email</strong> once it is live, with a link straight to
                your listing so you can check it reads the way you want.
              </li>
              <li>
                <strong>Anything to change?</strong> Logo, hours, socials or address — just reply to that
                email and we will update it. There is no portal to learn.
              </li>
            </ol>

            <p className="mt-note">
              Your membership renews monthly and you can cancel at any time by emailing us. Each tier is
              limited to one business per service per area, so your slot is held for as long as you keep
              it.
            </p>
          </>
        )}

        <p className="mt-contact">
          Questions? Email <a href={`mailto:${config.email}`}>{config.email}</a> or call{' '}
          <a href={config.partnerPhoneHref}>{config.partnerPhone}</a>.
        </p>
      </div>
    </div>
  );
}

/*
 * Self-styled like the privacy page rather than pulling in the design system:
 * this route is reached directly from Stripe, so it must render correctly on
 * its own without the site's sections or their stylesheet ordering.
 */
const CSS = `
.mt {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(24px, 6vw, 72px) 16px;
  background: #f4f6f8;
  color: #101418;
  font: 400 16px/1.6 system-ui, -apple-system, sans-serif;
}
.mt-card {
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-radius: 16px;
  padding: clamp(24px, 5vw, 44px);
  box-shadow: 0 10px 40px rgba(16,20,24,0.10);
}
.mt-back {
  display: inline-block;
  margin-bottom: 20px;
  color: #46535c;
  font-size: 14px;
  text-decoration: none;
}
.mt-back:hover { color: #101418; text-decoration: underline; }
.mt-tick {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: #e6f4f1;
  color: #0b756c;
  margin-bottom: 18px;
}
.mt h1 {
  margin: 0 0 12px;
  font-size: clamp(24px, 4.5vw, 30px);
  line-height: 1.25;
  letter-spacing: -0.01em;
  text-wrap: balance;
}
.mt h2 {
  margin: 30px 0 12px;
  font-size: 17px;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  color: #46535c;
}
.mt-lede { margin: 0 0 8px; font-size: 17px; color: #26323a; }
.mt-receipt { margin: 0; color: #46535c; font-size: 15px; }
.mt-loading { margin: 0; color: #46535c; }
.mt-steps { margin: 0; padding-left: 20px; }
.mt-steps li { margin-bottom: 12px; color: #26323a; }
.mt-note {
  margin: 24px 0 0;
  padding: 14px 16px;
  background: #f4f6f8;
  border-radius: 10px;
  font-size: 15px;
  color: #46535c;
}
.mt-contact {
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid rgba(16,20,24,0.10);
  font-size: 15px;
  color: #46535c;
}
.mt-contact a { color: #0b756c; }
@media (prefers-reduced-motion: no-preference) {
  .mt-card { animation: mt-in 240ms ease-out; }
  @keyframes mt-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
}
`;
