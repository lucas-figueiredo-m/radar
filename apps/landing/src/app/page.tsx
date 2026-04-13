import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { SocialProof } from '@/components/SocialProof';
import { FeatureGrid } from '@/components/FeatureGrid';
import { FeatureSection } from '@/components/FeatureSection';
import { McpSection } from '@/components/McpSection';
import { HowItWorks } from '@/components/HowItWorks';
import { ComparisonTable } from '@/components/ComparisonTable';
import { MultiDevice } from '@/components/MultiDevice';
import { CtaSection } from '@/components/CtaSection';
import { Footer } from '@/components/Footer';

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <FeatureGrid />
        <FeatureSection />
        <McpSection />
        <HowItWorks />
        <ComparisonTable />
        <MultiDevice />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
