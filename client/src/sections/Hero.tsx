import { ImagePanel } from '../components/ImagePanel';
import { CATEGORIES, CATEGORY_SHORT_LABELS } from '../types';
import type { PartnerSearch } from '../hooks/usePartnerSearch';

interface HeroProps {
  search: PartnerSearch;
}

/**
 * Design B puts the zip search in the hero, above the fold — the carinsurance.com
 * pattern. Someone who has just had an accident lands and can search
 * immediately, rather than scrolling to a section further down as in design A.
 */
export function Hero({ search }: HeroProps) {
  const { zip, changeZip, selected, toggleCategory, error, loading, submit } = search;

  return (
    <section id="top" className="hero">
      <div className="hero-inner">
        <div>
          <span className="eyebrow">Your first call after an accident</span>
          <h1 className="hero-title">Trusted help after a California crash</h1>
          <p className="hero-lede">
            Enter your zip code and we'll show you the towing, collision repair, and personal injury
            partners serving your area — so you know exactly who to call next.
          </p>

          <form className="search-card" onSubmit={submit} noValidate id="find-help">
            <fieldset className="chip-row">
              <legend className="search-label">What do you need help with?</legend>
              {CATEGORIES.map((category) => (
                <label key={category} className="chip">
                  <input
                    type="checkbox"
                    checked={selected.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className="tick" aria-hidden="true">
                    ✓
                  </span>
                  {CATEGORY_SHORT_LABELS[category]}
                </label>
              ))}
            </fieldset>

            <label className="search-label" htmlFor="zip">
              Your zip code
            </label>
            <div className="search-row">
              <input
                id="zip"
                className="input"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="e.g. 90210"
                value={zip}
                onChange={(e) => changeZip(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Searching…' : 'Find partners'}
              </button>
            </div>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <p className="hero-note">Free to search · No sign-up required</p>
          </form>

          {/* <div className="hero-cta-row">
            <a href="#apply" className="btn btn-secondary">
              I'm a business — join the network
            </a>
          </div> */}
        </div>

        <figure className="hero-figure">
          <ImagePanel
            src="/hero.jpg"
            alt="Two vehicles with front-end damage after a collision"
            placeholder="Hero photo — roadside assistance"
            priority
          />
        </figure>
      </div>
    </section>
  );
}
