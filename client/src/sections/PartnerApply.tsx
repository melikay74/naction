import { usePartnerApplication } from '../hooks/usePartnerApplication';
import { config } from '../config';
import { CATEGORIES, CATEGORY_LABELS, TIER_LABELS, type Category, type Tier } from '../types';

/** The memberships on offer, cheapest first. `tier` is the badge a member earns in search results. */
const MEMBERSHIPS: { name: string; price: string; description: string; tier?: Tier }[] = [
  { name: 'Get Listed', price: 'Free', description: 'Your business name, city and phone number, listed in the network.' },
  {
    name: 'Get Priority',
    price: '$29.99/mo',
    description: 'Ranked above free listings, with your street address linked to directions.',
    tier: 'priority',
  },
  {
    name: 'Get Featured',
    price: '$49.99/mo',
    description: 'Adds your logo, website and two social profiles, ranked above Priority.',
    tier: 'featured',
  },
  {
    name: 'Network Partner',
    price: '$99.99/mo',
    description:
      'A full-width spotlight above all other results with your logo, every social profile and a scan-to-save contact card.',
    tier: 'network',
  },
];

export function PartnerApply() {
  const { form, update, submit, submitting, submitted, error, fieldError, errorFor } =
    usePartnerApplication();

  return (
    <section id="apply" className="apply">
      <div className="section">
        <div className="center">
          <span className="eyebrow">Become a partner today</span>
          <h2 className="section-title">Join the network helping Californians</h2>
          <p className="section-lede">
            Tell us about your business and we'll be in touch. Every application is reviewed personally.
          </p>
        </div>

        <div className="apply-grid">
          {submitted ? (
            <div className="card success">
              <div className="success-mark" aria-hidden="true">
                ✓
              </div>
              <h3>Application received</h3>
              <p className="card-body">
                Thanks, {form.contactName} — we'll review your application and follow up at {form.email}{' '}
                shortly.
              </p>
            </div>
          ) : (
            <form className="card apply-form" onSubmit={submit} noValidate>
              <div className="field-pair">
                <div className="field">
                  <label htmlFor="contactName">Contact name</label>
                  <input
                    id="contactName"
                    className="input"
                    autoComplete="name"
                    value={form.contactName}
                    onChange={update('contactName')}
                  />
                  {errorFor('contactName') && (
                    <span className="field-error">{errorFor('contactName')}</span>
                  )}
                </div>
                <div className="field">
                  <label htmlFor="businessName">Business name</label>
                  <input
                    id="businessName"
                    className="input"
                    autoComplete="organization"
                    value={form.businessName}
                    onChange={update('businessName')}
                  />
                  {errorFor('businessName') && (
                    <span className="field-error">{errorFor('businessName')}</span>
                  )}
                </div>
              </div>

              <div className="field">
                <label htmlFor="businessType">Business type</label>
                <select
                  id="businessType"
                  className="input"
                  value={form.businessType}
                  onChange={update('businessType')}
                >
                  {CATEGORIES.map((category: Category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-pair">
                <div className="field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    className="input"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update('phone')}
                  />
                  {errorFor('phone') && <span className="field-error">{errorFor('phone')}</span>}
                </div>
                <div className="field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    className="input"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update('email')}
                  />
                  {errorFor('email') && <span className="field-error">{errorFor('email')}</span>}
                </div>
              </div>

              <div className="field">
                <label htmlFor="website">Website (optional)</label>
                <input
                  id="website"
                  className="input"
                  value={form.website}
                  onChange={update('website')}
                />
              </div>

              <div className="field">
                <label htmlFor="serviceArea">Service area / city</label>
                <input
                  id="serviceArea"
                  className="input"
                  value={form.serviceArea}
                  onChange={update('serviceArea')}
                />
                {errorFor('serviceArea') && (
                  <span className="field-error">{errorFor('serviceArea')}</span>
                )}
              </div>

              {/* Honeypot — hidden from people, tempting to bots. */}
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="company_website_confirm">Leave this field empty</label>
                <input
                  id="company_website_confirm"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.company_website_confirm}
                  onChange={update('company_website_confirm')}
                />
              </div>

              {error && !fieldError && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? 'Sending…' : 'Apply to join'}
              </button>
            </form>
          )}

          <div>
            <div className="card tiers-panel">
              <span className="card-kicker">Membership</span>
              <h3>Choose a membership</h3>
              <p className="card-body">Four tiers with different features and pricing.</p>
              <ul className="tiers-panel-content">
                {MEMBERSHIPS.map((m) => (
                  <li key={m.name} className={`tier${m.tier ? ` tier-${m.tier}` : ''}`}>
                    <div className="tier-head">
                      <h4>{m.name}</h4>
                      <span className="tier-price">{m.price}</span>
                    </div>
                    {/* The badge a member earns in search results — the same component victims see. */}
                    {m.tier && <span className={`badge badge-${m.tier}`}>{TIER_LABELS[m.tier]}</span>}
                    <p className="tier-desc">{m.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="phone-panel">
              <h3>Prefer to talk it through?</h3>
              <p>This line is for businesses joining the network.</p>
              <a className="phone-number" href={config.partnerPhoneHref}>
                {config.partnerPhone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
