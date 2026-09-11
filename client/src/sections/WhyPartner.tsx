const BENEFITS = [
  'Increase your visibility with accident victims',
  'Become part of a growing California network',
  'Build professional relationships in your community',
  'Showcase your services to people looking for help',
  'Grow your business through trusted connections',
];

const VALUES = [
  'Quality service',
  'Reliability',
  'Professionalism',
  'Customer care',
  'Strong community reputation',
];

export function WhyPartner() {
  return (
    <section id="why-partner" className="section">
      <div className="center">
        <span className="eyebrow">Why partner with us</span>
        <h2 className="section-title">Grow your business through trusted connections</h2>
        <p className="section-lede">
          Are you a towing provider, collision repair shop, or personal injury attorney? Join the network
          helping Californians after a crash.
        </p>
      </div>

      <div className="benefit-grid">
        {BENEFITS.map((benefit) => (
          <div className="benefit" key={benefit}>
            <span className="tick" aria-hidden="true">
              ✓
            </span>
            <p>{benefit}</p>
          </div>
        ))}
      </div>

      <div className="center">
        <p className="section-lede">
          We are looking for professional partners. We value partners who provide:
        </p>
        <div className="chip-row chip-row-center">
          {VALUES.map((value) => (
            <span className="tag tag-accent" key={value}>
              {value}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
