import Hero from '../sections/Hero';
import SocialProofStrip from '../sections/SocialProofStrip';
import ProblemSection from '../sections/ProblemSection';
import SolutionSection from '../sections/SolutionSection';
import AppShowcase from '../sections/AppShowcase';
import FeaturesSection from '../sections/FeaturesSection';
import PricingSection from '../sections/PricingSection';
import FAQSection from '../sections/FAQSection';
import FinalCTA from '../sections/FinalCTA';

/**
 * Landing page: all marketing sections in order.
 * Layout (Navbar, Footer) is provided by the parent route.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProofStrip />
      <ProblemSection />
      <SolutionSection />
      <AppShowcase />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
    </>
  );
}
