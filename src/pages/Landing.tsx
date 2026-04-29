import { useEffect } from "react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { NexIASection } from "@/components/landing/NexIASection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { SectionDivider } from "@/components/landing/SectionDivider";

const Landing = () => {
  // Garante fundo preto puro na landing (independente do tema do app)
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#000";
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  return (
    <div className="relative min-h-screen text-white" style={{ background: "#000" }}>
      <BackgroundVideo />
      <Navigation />
      <main className="relative">
        <HeroSection />
        <SectionDivider />
        <TestimonialsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <NexIASection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <CTASection />
        <footer className="py-12 text-center text-white/40 text-sm">
          © {new Date().getFullYear()} Nexvior · Todos os direitos reservados
        </footer>
      </main>
    </div>
  );
};

export default Landing;
