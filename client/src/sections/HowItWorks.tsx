const STEPS = [
  {
    number: '1',
    title: 'You search your area',
    body: 'Enter your zip code and choose the services you need after an accident.',
  },
  {
    number: '2',
    title: 'We connect you',
    body: 'We show you the towing, repair, and legal partners in our network serving your area.',
  },
  {
    number: '3',
    title: 'You get help',
    body: 'You reach out to a trusted professional directly — so you can focus on recovering.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section">
      <div className="center">
        <span className="eyebrow">How it works</span>
        <h2 className="section-title">Three steps, no guesswork</h2>
        <p className="section-lede">
          When an accident happens, people need reliable help quickly. Here's how we get you there.
        </p>
      </div>

      <div className="grid-3">
        {STEPS.map((step) => (
          <div className="card step-card" key={step.number}>
            <span className="step-number" aria-hidden="true">
              {step.number}
            </span>
            <h3 className="card-title">{step.title}</h3>
            <p className="card-body">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
