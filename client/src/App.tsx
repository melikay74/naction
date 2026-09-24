import { Suspense, lazy } from 'react';
import { CookieConsent } from './components/CookieConsent';
import { StagingBanner } from './components/StagingBanner';
import Site from './Site';

// Only the standalone pages are split out; the site itself is the common case
// and is imported directly so it renders without waiting on a second chunk.
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const MembershipThanks = lazy(() =>
  import('./pages/MembershipThanks').then((m) => ({ default: m.MembershipThanks })),
);

function path(): string {
  return window.location.pathname.replace(/\/+$/, '') || '/';
}

function page() {
  switch (path()) {
    case '/privacy':
      return <Privacy />;
    // Stripe's success_url. Must match createCheckoutSession() in
    // server/src/stripe.ts, or paying customers land on the homepage.
    case '/membership/thanks':
      return <MembershipThanks />;
    default:
      return <Site />;
  }
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <StagingBanner />
      {page()}
      <CookieConsent />
    </Suspense>
  );
}
