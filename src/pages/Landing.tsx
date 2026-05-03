import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { NexIASection } from "@/components/landing/NexIASection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { SectionDivider } from "@/components/landing/SectionDivider";
import { HeroVideo } from "@/components/landing/HeroVideo";
import logoFooter from "@/assets/logo-nexvior-white.png";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";

const Landing = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  useEffect(() => {
    document.title = "Nexvior — Controle total das suas finanças com IA";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Nexvior: app de finanças pessoais com IA mentora (nex.ia). Planos a partir de R$ 19,90/mês. Sem fidelidade."
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return (
    <div className="lp-root relative min-h-screen text-foreground">
      {/* Background video covers viewport behind content */}
      <HeroVideo />

      {/* Navbar overlays the video */}
      <div className="relative" style={{ zIndex: 50 }}>
        <LandingNav />
      </div>

      {/* Hero content (transparent over video) */}
      <div className="relative" style={{ zIndex: 10 }}>
        <HeroSection />
      </div>

      <SectionDivider />

      {/* Below-the-fold sections with solid background to cover the fixed video */}
      <div className="relative bg-background" style={{ zIndex: 10 }}>
        <TestimonialsSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <NexIASection />
        <SectionDivider />
        <PricingSection />
        <SectionDivider />
        <CTASection />

        <footer className="px-4 md:px-6 py-10 border-t border-border/30 flex flex-col items-center gap-3 text-muted-foreground text-xs">
          <img
            src={logoFooter}
            alt="Nexvior"
            className="h-8 w-auto opacity-90"
          />
          <span>© {new Date().getFullYear()} Nexvior. Todos os direitos reservados.</span>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
