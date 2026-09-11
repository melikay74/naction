import { useState } from 'react';
import { ImagePanel } from '../components/ImagePanel';
import { CATEGORY_ICONS } from '../components/icons';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_SHORT_LABELS, type Category } from '../types';

const PANELS: Record<Category, { body: string; bullets: string[]; image: string; alt: string }> = {
  tow: {
    body: 'Connecting accident victims with dependable towing providers when they need immediate vehicle assistance.',
    bullets: [
      'Dispatch partners covering major California metros',
      'Vetted for response time and vehicle handling',
      'Reach the provider directly — no call centre in between',
    ],
    image: '/service-tow.jpg',
    alt: 'A tow truck loading a vehicle after a collision',
  },
  repair: {
    body: 'Helping drivers find trusted repair professionals to restore their vehicles safely and efficiently.',
    bullets: [
      'Collision specialists, not general mechanics',
      'Chosen for workmanship and clear estimates',
      'Shops across every region we cover',
    ],
    image: '/service-repair.jpg',
    alt: 'A technician repairing collision damage in a body shop',
  },
  legal: {
    body: 'Connecting accident victims with experienced legal professionals who can provide guidance after a crash.',
    bullets: [
      'Personal injury attorneys experienced with California claims',
      'Guidance on what to do in the days after a crash',
      'You choose who to contact — we make no referral for you',
    ],
    image: '/service-legal.jpg',
    alt: 'An attorney meeting with a client about an injury claim',
  },
};

/** Tabbed service switcher, adapted from KeyNest's product switcher. */
export function ServiceTabs() {
  const [active, setActive] = useState<Category>('tow');
  const panel = PANELS[active];
  const Icon = CATEGORY_ICONS[active];

  return (
    <section id="services" className="section">
      <span className="eyebrow">Our network partners</span>
      <h2 className="section-title">Three kinds of help, one place to find them</h2>
      <p className="section-lede">
        We're building a statewide network of quality partners in the three areas that matter most
        immediately after a collision.
      </p>

      <div className="tablist" role="tablist" aria-label="Partner categories">
        {CATEGORIES.map((category) => {
          const TabIcon = CATEGORY_ICONS[category];
          return (
            <button
              key={category}
              type="button"
              role="tab"
              id={`tab-${category}`}
              aria-selected={active === category}
              aria-controls={`panel-${category}`}
              className="tab"
              onClick={() => setActive(category)}
            >
              <TabIcon />
              {CATEGORY_SHORT_LABELS[category]}
            </button>
          );
        })}
      </div>

      <div
        className="tabpanel"
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
      >
        <div>
          <div className="column-head">
            <Icon />
            <h3>{CATEGORY_LABELS[active]}</h3>
          </div>
          <p className="section-lede">{panel.body}</p>
          <ul className="bullets">
            {panel.bullets.map((bullet) => (
              <li key={bullet}>
                <span className="tick" aria-hidden="true">
                  ✓
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          <a href="#find-help" className="btn btn-primary">
            Find {CATEGORY_SHORT_LABELS[active].toLowerCase()} near me
          </a>
        </div>

        <figure className="tabpanel-figure">
          <ImagePanel
            src={panel.image}
            alt={panel.alt}
            placeholder={`${CATEGORY_SHORT_LABELS[active]} photo`}
          />
        </figure>
      </div>
    </section>
  );
}
