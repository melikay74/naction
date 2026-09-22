import { config } from '../config';

const COLUMNS = [
  {
    title: 'For drivers',
    links: [
      { href: '#find-help', label: 'Find partners near you' },
      { href: '#how-it-works', label: 'How it works' },
      { href: '#coverage', label: 'Coverage areas' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'For businesses',
    links: [
      { href: '#why-partner', label: 'Why partner with us' },
      { href: '#apply', label: 'Apply to join' },
      { href: '#services', label: 'Service categories' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand-block">
          <div className="footer-brand">
            <img src="/logo.png" alt="" width={32} height={32} />
            {config.businessName}
          </div>
          <p>&ldquo;{config.tagline}&rdquo;</p>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <ul>
            <li>
              Partner line: <a href={config.partnerPhoneHref}>{config.partnerPhone}</a>
            </li>
            <li>
              <a href={`mailto:${config.email}`}>{config.email}</a>
            </li>
            <li>
              <a href={config.websiteHref}>{config.website}</a>
            </li>
            <li>
              <a href="/privacy">Privacy policy</a>
            </li>
          </ul>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

      </div>

      <p className="footer-bottom">
        {config.businessName} is a referral network. We are not a law firm, towing company, or repair shop,
        and we do not provide legal, medical, or repair services. Listed partners are independent
        businesses; any services, fees, and agreements are arranged directly between you and the partner
        you contact. The phone number above is for businesses applying to join the network. In an
        emergency, call 911.
      </p>
    </footer>
  );
}
