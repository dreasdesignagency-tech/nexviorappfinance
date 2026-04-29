import { ArrowRight, Sparkles } from "lucide-react";
import { CHECKOUT_MENSAL } from "@/config/checkout";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-5 sm:px-8 pt-32 pb-20">
      <div className="max-w-5xl mx-auto text-center">
        <a
          href="#planos"
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-nav border border-white/10 text-sm text-white/80 hover:text-white transition-colors mb-10"
        >
          <Sparkles className="w-4 h-4 text-neon" />
          Planos a partir de <span className="text-neon font-medium">R$ 19,90/mês</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <h1 className="font-black text-white tracking-tight leading-[0.95] text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          Controle total das suas{" "}
          <span className="font-playfair italic font-medium bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent text-glow">
            finanças
          </span>{" "}
          sem complicação
        </h1>

        <p className="mt-8 max-w-2xl mx-auto text-lg sm:text-xl text-white/60 leading-relaxed">
          Organize seus gastos, cartões e investimentos em um só lugar com inteligência
          artificial que realmente te ajuda a economizar.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={CHECKOUT_MENSAL}
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-primary-glow text-white font-semibold neon-glow hover:scale-[1.02] transition-transform"
          >
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            Começar por R$ 19,90/mês
          </a>
          <a
            href="#recursos"
            className="px-8 py-4 rounded-full bg-black border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
          >
            Ver como funciona
          </a>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/50">
          <span className="flex items-center gap-2"><span className="text-neon">✓</span> Sem fidelidade</span>
          <span className="flex items-center gap-2"><span className="text-neon">✓</span> Cancele quando quiser</span>
          <span className="flex items-center gap-2"><span className="text-neon">✓</span> Acesso imediato</span>
        </div>
      </div>
    </section>
  );
};
