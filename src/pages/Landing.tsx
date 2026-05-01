import { useEffect } from "react";
import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { NexIASection } from "@/components/landing/NexIASection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { SectionDivider } from "@/components/landing/SectionDivider";
import { HeroVideo } from "@/components/landing/HeroVideo";

const Landing = () => {
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
    <div className="lp-root min-h-screen text-white">
      {/* fundo radial sutil */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--lp-neon) / 0.18), transparent 60%), hsl(var(--lp-bg))",
        }}
        aria-hidden
      />
      {/* estrelas */}
      <div className="fixed inset-0 -z-10 opacity-40 pointer-events-none lp-stars" aria-hidden />

      <LandingNav />

      <main>
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
      </main>

      <footer className="px-4 md:px-6 py-10 border-t border-[hsl(var(--lp-border))] text-center text-white/40 text-xs">
        © {new Date().getFullYear()} Nexvior. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Landing;
