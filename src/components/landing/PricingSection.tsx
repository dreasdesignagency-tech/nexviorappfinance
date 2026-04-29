import { Check, Sparkles } from "lucide-react";
import { CHECKOUT_ANUAL, CHECKOUT_MENSAL } from "@/config/checkout";

export const PricingSection = () => {
  return (
    <section id="planos" className="relative py-28 px-5 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
            Escolha o plano <span className="font-playfair italic font-medium">ideal</span> para você
          </h2>
          <p className="mt-5 text-white/60">Comece a organizar sua vida financeira hoje mesmo</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Mensal */}
          <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-8 sm:p-10 flex flex-col">
            <h3 className="text-white text-2xl font-bold">Plano Mensal</h3>
            <p className="text-white/55 text-sm mt-1">Ideal para começar agora</p>
            <div className="mt-8 flex items-end gap-1">
              <span className="text-white text-5xl font-black">R$ 19,90</span>
              <span className="text-white/50 text-sm pb-2">/mês</span>
            </div>
            <ul className="mt-8 space-y-3 text-white/80 text-sm flex-1">
              {["Controle total de finanças", "Organização automática com IA", "Gestão de cartões, gastos e metas", "Insights inteligentes"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-neon" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={CHECKOUT_MENSAL}
              className="mt-10 w-full py-4 rounded-full bg-black border border-white/15 text-white font-semibold text-center hover:bg-white/5 transition-colors"
            >
              Começar agora
            </a>
            <p className="mt-4 text-center text-white/40 text-xs">Cancele quando quiser. Sem fidelidade.<br />Acesso imediato após pagamento</p>
          </div>

          {/* Anual */}
          <div className="relative rounded-3xl bg-gradient-to-b from-primary/10 to-transparent border-2 border-primary/60 p-8 sm:p-10 flex flex-col neon-glow scale-100 lg:scale-[1.03]">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary-glow text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" /> MELHOR ESCOLHA
            </span>
            <h3 className="text-white text-2xl font-bold">Plano Anual</h3>
            <p className="text-white/55 text-sm mt-1">Economize mais de 35%</p>
            <div className="mt-8 flex items-end gap-1">
              <span className="text-white text-5xl font-black">R$ 149,90</span>
              <span className="text-white/50 text-sm pb-2">/ano</span>
            </div>
            <p className="text-neon text-sm mt-2 font-medium">Equivalente a menos de R$ 12/mês</p>
            <ul className="mt-7 space-y-3 text-white/85 text-sm flex-1">
              {["Tudo do plano mensal", "Economia no valor anual", "Prioridade em novos recursos"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-neon" /> {f}
                </li>
              ))}
            </ul>
            <a
              href={CHECKOUT_ANUAL}
              className="mt-10 w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-glow text-white font-semibold text-center hover:scale-[1.01] transition-transform"
            >
              Quero economizar
            </a>
            <p className="mt-4 text-center text-white/40 text-xs">Cancele quando quiser. Sem fidelidade.<br />Acesso imediato após pagamento</p>
          </div>
        </div>
      </div>
    </section>
  );
};
