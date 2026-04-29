import { ArrowRight, TrendingDown } from "lucide-react";
import { CHECKOUT_ANUAL, CHECKOUT_MENSAL } from "@/config/checkout";

export const CTASection = () => {
  return (
    <section id="beneficios" className="relative py-28 px-5 sm:px-8">
      <div className="max-w-4xl mx-auto rounded-3xl bg-white/[0.02] border border-white/10 p-10 sm:p-16 text-center neon-glow">
        <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
          Comece a organizar suas{" "}
          <span className="font-playfair italic font-medium">finanças hoje</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-white/65 text-lg leading-relaxed">
          Junte-se aos usuários que já estão tomando decisões financeiras mais inteligentes com o Nexvior. Crie sua conta em menos de um minuto e comece agora.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={CHECKOUT_MENSAL}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary-glow text-white font-semibold neon-glow hover:scale-[1.02] transition-transform"
          >
            <ArrowRight className="w-5 h-5" /> Começar agora
          </a>
          <a
            href={CHECKOUT_ANUAL}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-black border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
          >
            <TrendingDown className="w-5 h-5" /> Economizar no anual
          </a>
        </div>

        <p className="mt-8 text-white/45 text-sm">
          Leva menos de 1 minuto para começar • Sem fidelidade • Acesso imediato
        </p>
      </div>
    </section>
  );
};
