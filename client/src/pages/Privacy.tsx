import { config } from '../config';

/**
 * Privacy policy.
 *
 * DRAFT — written from what the site actually does, so it is accurate about the
 * data flow rather than boilerplate. It still needs review by counsel before
 * launch, and the retention period and any service providers named below must be
 * confirmed against real practice.
 *
 * Self-styled rather than using the design system, so it reads as a plain legal
 * document. Restyle it against the site's tokens if you would rather it match.
 */
export function Privacy() {
  return (
    <>
      <style>{CSS}</style>
      <div className="pp">
        <header className="pp-head">
          <a className="pp-back" href="/">
            ← Back to {config.businessName.replace(' LLC', '')}
          </a>
          <h1>Privacy Policy</h1>
          <p className="pp-updated">Last updated {config.privacyUpdated}</p>
        </header>

        <div className="pp-notice">
          <strong>Draft for legal review.</strong> This policy describes how the site currently works. It
          has not yet been reviewed by an attorney, and the retention period and service providers named
          below must be confirmed before launch.
        </div>

        <section>
          <h2>Who we are</h2>
          <p>
            {config.businessName} operates a referral network that connects people in California with
            independent towing, collision repair, and personal injury professionals after a vehicle
            accident. You can reach us at <a href={`mailto:${config.email}`}>{config.email}</a>.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>
          <p>There are only two ways this site collects information from you.</p>

          <h3>When you search for partners</h3>
          <p>
            Searching asks for a <strong>zip code</strong> and which service categories you need. We use
            the zip code solely to work out which partners serve your area and return them to you. We do
            not ask for your name, contact details, or any information about your accident, and we do not
            store your search or connect it to you.
          </p>

          <h3>When you apply to join the network as a business</h3>
          <p>
            The partner application form collects your <strong>name, business name, business type, phone
            number, email address, service area,</strong> and optionally your <strong>website</strong>. We
            store these so we can review your application and contact you about it. Applications are
            retained for as long as we are considering or maintaining a partner relationship with you.
          </p>
        </section>

        <section>
          <h2>What we do not do</h2>
          <ul>
            <li>
              We do not sell your personal information, and we do not share it with third parties for
              cross-context behavioural advertising.
            </li>
            <li>
              We do not pass your details to partners when you search. You contact partners yourself,
              directly, using the phone numbers shown.
            </li>
            <li>We do not collect information from anyone we know to be under 16.</li>
          </ul>
        </section>

        <section>
          <h2>Cookies and analytics</h2>
          <p>
            {config.analyticsId ? (
              <>
                We use analytics cookies to understand how people use the site, and only after you accept
                them. Declining sets no analytics cookies and does not limit anything on the site. You can
                change your mind at any time by clearing this site's data in your browser.
              </>
            ) : (
              <>
                This site currently sets <strong>no cookies at all</strong> — no analytics, no advertising,
                and no third-party tracking. If that changes we will ask for your consent first, and
                update this policy.
              </>
            )}
          </p>
          <p>
            We serve our own fonts and images rather than loading them from third parties, so browsing
            this site does not disclose your visit or IP address to any outside company.
          </p>
        </section>

        <section>
          <h2>Your California privacy rights</h2>
          <p>
            California residents have the right to know what personal information we hold about them, to
            request a copy of it, to ask us to correct or delete it, and not to be discriminated against
            for exercising any of these rights. Because we do not sell or share personal information for
            advertising, there is nothing here to opt out of — but you may still make any of the requests
            above.
          </p>
          <p>
            To make a request, email <a href={`mailto:${config.email}`}>{config.email}</a>. We may need to
            verify your identity before acting, and we will respond within the timeframe the law requires.
          </p>
        </section>

        <section>
          <h2>How we protect information</h2>
          <p>
            Partner applications are transmitted over an encrypted connection and stored on servers we
            control, accessible only to people who need them to review applications. No method of storage
            or transmission is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>Important: what this service is not</h2>
          <p>
            {config.businessName} is a referral network. We are not a law firm, towing company, or repair
            shop, and we do not provide legal, medical, or repair services. Listed partners are
            independent businesses, and any services, fees, and agreements are arranged directly between
            you and the partner you contact. Contacting a partner through this site does not create an
            attorney–client relationship with us or with them.
          </p>
        </section>

        <section>
          <h2>Changes to this policy</h2>
          <p>
            If we change how we handle personal information, we will update this page and revise the date
            at the top.
          </p>
        </section>

        <footer className="pp-foot">
          <a href="/">← Back to the site</a>
        </footer>
      </div>
    </>
  );
}

const CSS = `
/* This page is self-styled, so it sets its own ground rather than relying on
   the site stylesheet. */
body { margin: 0; background: #fff; }
.pp {
  max-width: 760px;
  margin: 0 auto;
  padding: 56px 24px 96px;
  font: 400 17px/1.7 system-ui, -apple-system, "Segoe UI", sans-serif;
  color: #1d2b33;
  background: #fff;
}
.pp-head { margin-bottom: 32px; }
.pp-back {
  display: inline-block;
  margin-bottom: 24px;
  font-size: 15px;
  font-weight: 600;
  color: #0b756c;
  text-decoration: none;
}
.pp-back:hover { text-decoration: underline; }
.pp h1 { font-size: 40px; line-height: 1.15; margin: 0 0 8px; letter-spacing: -0.02em; }
.pp-updated { margin: 0; color: #66757e; font-size: 15px; }
.pp-notice {
  background: #fff8e6;
  border: 1px solid #f0d999;
  border-radius: 10px;
  padding: 16px 18px;
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 40px;
}
.pp section { margin-bottom: 40px; }
.pp h2 { font-size: 24px; margin: 0 0 12px; letter-spacing: -0.01em; }
.pp h3 { font-size: 18px; margin: 24px 0 8px; }
.pp p { margin: 0 0 16px; }
.pp ul { margin: 0 0 16px; padding-left: 22px; }
.pp li { margin-bottom: 10px; }
.pp a { color: #0b756c; }
.pp-foot {
  border-top: 1px solid #e3e9ec;
  padding-top: 24px;
  font-size: 15px;
}
.pp-foot a { color: #0b756c; text-decoration: none; font-weight: 600; }
.pp-foot a:hover { text-decoration: underline; }
@media (max-width: 560px) {
  .pp { padding: 36px 20px 72px; font-size: 16px; }
  .pp h1 { font-size: 32px; }
}
`;
