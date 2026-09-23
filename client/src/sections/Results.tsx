import { CATEGORY_ICONS } from '../components/icons';
import { ContactQr } from '../components/ContactQr';
import { SocialLinks } from '../components/SocialLinks';
import { trackPartnerClick } from '../lib/analytics';
import { prettyUrl } from '../lib/socials';
import { vCardHref } from '../lib/vcard';
import {
  CATEGORY_LABELS,
  TIER_LABELS,
  type Category,
  type CategoryPage,
  type PartnerResult,
} from '../types';
import type { PartnerSearch } from '../hooks/usePartnerSearch';

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
);

/** Street address as a directions link — someone stranded wants a map, not text. */
function AddressLink({ address }: { address: string }) {
  return (
    <a
      className="partner-address"
      href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <PinIcon />
      {address}
    </a>
  );
}

function WebsiteLink({ website, partner }: { website: string; partner: PartnerResult }) {
  return (
    <a
      className="partner-website"
      href={website}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackPartnerClick('Website', partner)}
    >
      <GlobeIcon />
      {prettyUrl(website)}
    </a>
  );
}

/**
 * The partner's phone number.
 *
 * The click is recorded before the dialer opens. Tracking is fire-and-forget
 * (Matomo sends an image beacon) and a tel: link does not unload the page, so
 * nothing here can delay or block the call — which must never happen on a site
 * someone reaches from the roadside.
 */
function PhoneLink({ partner, className }: { partner: PartnerResult; className?: string }) {
  return (
    <a
      className={className ?? 'partner-phone'}
      href={partner.tel}
      onClick={() => trackPartnerClick('Phone', partner)}
    >
      <PhoneIcon />
      {partner.phone}
    </a>
  );
}

function Badges({ partner }: { partner: PartnerResult }) {
  if (!partner.tier) return null;
  return (
    <div className="badge-row">
      {/* Label the tier in words — the colour alone must not carry the status. */}
      <span className={`badge badge-${partner.tier}`}>{TIER_LABELS[partner.tier]}</span>
    </div>
  );
}

/**
 * A column card. Renders whatever the API sent — the server has already
 * limited the fields to what the partner's tier entitles, so there is no tier
 * logic here beyond the badge and edge colour.
 */
function PartnerCard({ partner }: { partner: PartnerResult }) {
  return (
    <div className={`partner-card${partner.tier ? ` partner-card-${partner.tier}` : ''}`}>
      <Badges partner={partner} />
      <div className="partner-head">
        {partner.logo && <img className="partner-logo" src={partner.logo} alt="" width="48" height="48" />}
        <div>
          {partner.website ? (
            <a className="partner-name" href={partner.website} target="_blank" rel="noopener noreferrer">
              {partner.name}
            </a>
          ) : (
            <span className="partner-name">{partner.name}</span>
          )}
          {/* The street address already names the city, so only address-less (free) cards show it. */}
          {(!partner.address || partner.note) && (
            <div className="partner-meta">
              {!partner.address && partner.city}
              {partner.note && (partner.address ? partner.note : ` · ${partner.note}`)}
            </div>
          )}
        </div>
      </div>
      {partner.address && <AddressLink address={partner.address} />}
      <PhoneLink partner={partner} />
      {partner.website && <WebsiteLink website={partner.website} partner={partner} />}
      {partner.socials && <SocialLinks socials={partner.socials} />}
    </div>
  );
}

/** The full-width Network Partner card in the band above the columns. */
function SpotlightCard({ partner }: { partner: PartnerResult }) {
  return (
    <article className="spotlight-card">
      <div className="spotlight-body">
        <div className="spotlight-kicker">
          <span className={`badge badge-${partner.tier}`}>{TIER_LABELS[partner.tier!]}</span>
          <span className="spotlight-category">{CATEGORY_LABELS[partner.category]}</span>
        </div>
        <div className="spotlight-identity">
          <div className="spotlight-logo">
            {partner.logo ? (
              <img src={partner.logo} alt="" width="64" height="64" />
            ) : (
              <span className="spotlight-logo-fallback" aria-hidden="true">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>
          <h4 className="spotlight-name">{partner.name}</h4>
        </div>
        {partner.address ? (
          <AddressLink address={partner.address} />
        ) : (
          <div className="partner-meta">{partner.city}</div>
        )}
        <div className="spotlight-contact">
          <PhoneLink partner={partner} className="partner-phone spotlight-phone" />
          {partner.website && <WebsiteLink website={partner.website} partner={partner} />}
        </div>
        {partner.socials && <SocialLinks socials={partner.socials} />}
        {/* Phones cannot scan their own screen; hand them the same vCard directly. */}
        <a className="btn btn-secondary spotlight-save" href={vCardHref(partner)} download={`${partner.id}.vcf`}>
          Save contact
        </a>
      </div>

      <ContactQr partner={partner} />
    </article>
  );
}

interface ColumnProps {
  category: Category;
  page?: CategoryPage;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: (category: Category) => void;
  /** True when this is the only category shown, so cards flow in rows. */
  single: boolean;
}

function Column({ category, page, loading, loadingMore, onLoadMore, single }: ColumnProps) {
  const Icon = CATEGORY_ICONS[category];
  const shown = page?.items.length ?? 0;

  // In the single-category layout the paid tiers get a row of their own and
  // free partners start beneath it. Split on the leading run of tiered
  // partners only: a sponsor that ranks lower (statewide-only, unpromoted)
  // stays in the flow where the ranking put it.
  const items = page?.items ?? [];
  const sponsoredCount = single ? items.findIndex((p) => !p.tier) : 0;
  const sponsored = sponsoredCount === -1 ? items : items.slice(0, Math.max(sponsoredCount, 0));
  const rest = sponsoredCount === -1 ? [] : items.slice(Math.max(sponsoredCount, 0));

  return (
    <div className="result-column">
      <div className="column-head">
        <Icon />
        <h3 className="column-title">{CATEGORY_LABELS[category]}</h3>
      </div>

      {loading ? (
        <>
          <p className="column-count">Searching…</p>
          <div className="column-cards">
            {[0, 1, 2].map((i) => (
              <div className="skeleton" key={i} aria-hidden="true" />
            ))}
          </div>
        </>
      ) : !page || page.total === 0 ? (
        <div className="empty">
          No {CATEGORY_LABELS[category].toLowerCase()} listed for this area yet. We're adding partners
          statewide — check back soon.
        </div>
      ) : (
        <>
          <p className="column-count">
            Showing {shown} of {page.total}
          </p>
          {sponsored.length > 0 && (
            <div className="column-cards column-cards-sponsored">
              {sponsored.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
          {rest.length > 0 && (
            <div className="column-cards">
              {rest.map((partner) => (
                <PartnerCard key={partner.id} partner={partner} />
              ))}
            </div>
          )}
          {page.hasMore && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onLoadMore(category)}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Results sit immediately below the hero, since design B's search lives in the
 * hero itself. Renders nothing until a search has run.
 */
export function Results({ search }: { search: PartnerSearch }) {
  const { search: state, loading, loadingMore, loadMore } = search;

  // Network Partners from every selected category, in category order.
  const spotlight = state
    ? state.categories.flatMap((category) => state.results[category]?.spotlight ?? [])
    : [];

  return (
    <div aria-live="polite">
      {state && (
        <section id="results" className="results">
          <div className="section">
            <div className="results-head">
              <div>
                <span className="eyebrow">Your results</span>
                <h2 className="section-title title-flush">Partners near {state.zip}</h2>
              </div>
              {!loading && <p className="results-meta">Serving {state.regionLabel}</p>}
            </div>

            {!loading && spotlight.length > 0 && (
              <div className="spotlight">
                <div className="spotlight-head">
                  <h3 className="spotlight-title">Network Partners</h3>
                  <p className="column-count">
                    {spotlight.length === 1 ? '1 partner' : `${spotlight.length} partners`} serving {state.zip}
                  </p>
                </div>
                {spotlight.map((partner) => (
                  <SpotlightCard key={partner.id} partner={partner} />
                ))}
              </div>
            )}

            {/* One category would otherwise stack full-width cards down the page; let them flow in rows instead. */}
            <div className={`results-grid${state.categories.length === 1 ? ' results-grid-single' : ''}`}>
              {state.categories.map((category) => (
                <Column
                  key={category}
                  category={category}
                  page={state.results[category]}
                  loading={loading}
                  loadingMore={loadingMore === category}
                  onLoadMore={loadMore}
                  single={state.categories.length === 1}
                />
              ))}
            </div>

            <p className="results-disclosure">
              Network, Featured, and Priority partners are network members who pay for placement. Every partner
              listed is an independent business you contact directly.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
