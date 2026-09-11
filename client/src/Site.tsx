import { usePartnerSearch } from './hooks/usePartnerSearch';
import { Nav } from './components/Nav';
import { Hero } from './sections/Hero';
import { Results } from './sections/Results';
import { TrustBand } from './sections/TrustBand';
import { ServiceTabs } from './sections/ServiceTabs';
import { HowItWorks } from './sections/HowItWorks';
import { Coverage } from './sections/Coverage';
import { WhyPartner } from './sections/WhyPartner';
import { PartnerApply } from './sections/PartnerApply';
import { Faq } from './sections/Faq';
import { Footer } from './sections/Footer';

export default function Site() {
  // The search lives at the top so the hero form and the results section below
  // it share one state machine.
  const search = usePartnerSearch();

  return (
    <>
      <a className="skip-link" href="#find-help">
        Skip to partner search
      </a>
      <Nav />
      <main>
        <Hero search={search} />
        <Results search={search} />
        <TrustBand />
        <ServiceTabs />
        <HowItWorks />
        <Coverage />
        <WhyPartner />
        <PartnerApply />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
