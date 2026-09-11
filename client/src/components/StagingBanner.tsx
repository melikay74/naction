/**
 * Staging-only warning strip.
 *
 * The directory currently holds fictional businesses with 555 phone numbers.
 * Anyone landing on the staging URL — a client, a colleague, someone sent the
 * link — has to be able to tell at a glance that these are not real listings to
 * call after an accident.
 *
 * Shown when the site is built without VITE_SITE_ENV=production, so a
 * plain `npm run build` is safe by default and only the explicit production
 * build removes it. Its styles are scoped and self-contained so it renders the
 * same on the site and on the privacy page.
 */
export function StagingBanner() {
  if (import.meta.env.VITE_SITE_ENV === 'production') return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="staging-banner" role="status">
        <strong>Staging preview</strong>
        <span>
          Sample data only — the businesses and phone numbers listed here are fictional. Not for public
          use.
        </span>
      </div>
    </>
  );
}

const CSS = `
.staging-banner {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  background: #7a2e2e;
  color: #fff;
  font: 400 13px/1.4 system-ui, -apple-system, sans-serif;
  text-align: center;
}
.staging-banner strong { font-weight: 700; }
`;
