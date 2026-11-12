import { AboutSection } from './AboutSection';
import { ContactSection } from './ContactSection';
import { HeroSection } from './HeroSection';
import { WorkSection } from './WorkSection';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <WorkSection />
      <ContactSection />
    </>
  );
}
