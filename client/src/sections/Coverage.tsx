import { ImagePanel } from '../components/ImagePanel';
import { config } from '../config';

const AREAS = [
  'Stockton',
  'Los Angeles',
  'Bakersfield',
  'Sacramento'
];

export function Coverage() {
  return (
    <section id="coverage" className="section">
      <div className="split">
        <figure className="figure">
          <ImagePanel
            src={config.serviceAreaImage}
            alt="Map of the NAction Advisors California service area"
            placeholder="California service-area map"
          />
        </figure>

        <div>
          <span className="eyebrow">Where we operate</span>
          <h2 className="section-title">Building a statewide California network</h2>
          <p className="section-lede">
            We're growing across the state, with concentrated coverage in these regions. If nothing is
            listed locally yet, you'll still see partners who serve all of California.
          </p>
          <div className="chip-row">
            {AREAS.map((area) => (
              <span className="tag tag-outline" key={area}>
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
