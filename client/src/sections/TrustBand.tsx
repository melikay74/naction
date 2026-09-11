const STATS = [
  { value: '3', label: 'Service categories — towing, collision repair, and legal' },
  { value: '4', label: 'California cities in our growing coverage area' },
  { value: '24/7', label: 'Partners dispatching around the clock statewide' },
  { value: 'Free', label: 'To search — no sign-up, no obligation' },
];

/** Trust-credential strip, adapted from carinsurance.com's stats band. */
export function TrustBand() {
  return (
    <section className="band">
      <div className="band-inner">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
