import { Suspense, lazy } from 'react';
import { CookieConsent } from './components/CookieConsent';
import { StagingBanner } from './components/StagingBanner';
import Site from './Site';

// Only the privacy policy is split out; the site itself is the common case and
// is imported directly so it renders without waiting on a second chunk.
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));

function isPrivacy(): boolean {
  return window.location.pathname.replace(/\/+$/, '') === '/privacy';
}

export default function App() {
  return (
    <Suspense fallback={null}>
      <StagingBanner />
      {isPrivacy() ? <Privacy /> : <Site />}
      <CookieConsent />
    </Suspense>
  );
}
