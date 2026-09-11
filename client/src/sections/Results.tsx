import { CATEGORY_ICONS } from '../components/icons';
import {
  CATEGORY_LABELS,
  TIER_LABELS,
  type Category,
  type CategoryPage,
  type PartnerResult,
} from '../types';
import type { PartnerSearch } from '../hooks/usePartnerSearch';

function PartnerCard({ partner }: { partner: PartnerResult }) {
  return (
    <div className={`partner-card${partner.tier ? ` partner-card-${partner.tier}` : ''}`}>
      {(partner.tier || partner.match === 'statewide') && (
        <div className="badge-row">
          {/* Label the tier in words — the colour alone must not carry the status. */}
          {partner.tier && (
            <span className={`badge badge-${partner.tier}`}>{TIER_LABELS[partner.tier]}</span>
          )}
          {partner.match === 'statewide' && <span className="badge">Serves all California</span>}
        </div>
      )}
      {partner.website ? (
        <a className="partner-name" href={partner.website} target="_blank" rel="noopener noreferrer">
          {partner.name}
        </a>
      ) : (
        <span className="partner-name">{partner.name}</span>
      )}
      <div className="partner-meta">
        {partner.city}
        {partner.note && ` · ${partner.note}`}
      </div>
      <a className="partner-phone" href={partner.tel}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
        </svg>
        {partner.phone}
      </a>
    </div>
  );
}

interface ColumnProps {
  category: Category;
  page?: CategoryPage;
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: (category: Category) => void;
}

function Column({ category, page, loading, loadingMore, onLoadMore }: ColumnProps) {
  const Icon = CATEGORY_ICONS[category];
  const shown = page?.items.length ?? 0;

  return (
    <div className="result-column">
      <div className="column-head">
        <Icon />
        <h3 className="column-title">{CATEGORY_LABELS[category]}</h3>
      </div>

      {loading ? (
        <>
          <p className="column-count">Searching…</p>
          {[0, 1, 2].map((i) => (
            <div className="skeleton" key={i} aria-hidden="true" />
          ))}
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
          {page.items.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
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

            <div className="results-grid">
              {state.categories.map((category) => (
                <Column
                  key={category}
                  category={category}
                  page={state.results[category]}
                  loading={loading}
                  loadingMore={loadingMore === category}
                  onLoadMore={loadMore}
                />
              ))}
            </div>

            <p className="results-disclosure">
              Platinum, gold, and silver partners are network members who pay for featured placement. Every partner
              listed is an independent business you contact directly.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
