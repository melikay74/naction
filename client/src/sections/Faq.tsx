const FAQS = [
  {
    q: 'Is NAction Advisors a law firm?',
    a: "No. We're a referral network that connects you with independent towing, repair, and legal professionals — we don't provide legal, medical, or repair services ourselves.",
  },
  {
    q: 'Does it cost anything to search the network?',
    a: 'Searching is free. Any costs for towing, repairs, or legal representation are arranged directly between you and the partner you contact.',
  },
  {
    q: 'How are partners chosen?',
    a: 'We look for quality service, reliability, professionalism, customer care, and a strong community reputation before welcoming a business into the network.',
  },
  {
    q: 'What do the platinum, gold, and silver badges mean?',
    a: "Platinum, gold, and silver partners are network members who pay for featured placement, so they appear at the top of their category in that order. They still have to meet the same standards as every other partner, and a sponsor is only listed above others when it actually serves your area. Everyone shown is an independent business you contact directly \u2014 compare them and choose whoever suits you.",
  },
  {
    q: 'What if there are no partners in my zip code yet?',
    a: "We're growing across California. If nothing is listed locally, we'll show partners who serve the whole state, and we're adding new local partners continually.",
  },
  {
    q: "I'm a business — how do I join?",
    a: 'Fill out the partner application on this page, or call our partner line. We review every application and follow up directly.',
  },
];

export function Faq() {
  return (
    <section id="faq" className="section section-narrow">
      <div className="center">
        <span className="eyebrow">Frequently asked questions</span>
        <h2 className="section-title">Questions people ask us</h2>
      </div>

      <div className="faq-list">
        {FAQS.map((item) => (
          <details className="faq-item" key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
