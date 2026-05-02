import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";

const monthlyBenefits = [
  "Controle total de finanças",
  "Organização automática com IA",
  "Gestão de cartões, gastos e metas",
  "Insights inteligentes",
];

const annualBenefits = [
  "Tudo do plano mensal",
  "Economia no valor anual",
  "Prioridade em novos recursos",
];

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasAccess } = useSubscription();
  const goToPlan = () => {
    if (!user) navigate("/auth");
    else if (hasAccess) navigate("/app");
    else navigate("/planos");
  };
  return (
    <section id="planos" className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-14 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Escolha o plano <span className="font-playfair italic">ideal</span> para você
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece a organizar sua vida financeira hoje mesmo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto items-stretch">
          {/* MONTHLY */}
          <div className="group relative rounded-2xl md:rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 to-muted/20 backdrop-blur-md p-8 md:p-10 transition-all duration-300 hover:scale-[1.02] hover:border-border/70 hover:shadow-[0_10px_40px_-10px_hsl(var(--lp-neon)/0.25)]">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">Plano Mensal</h3>
              <p className="text-sm text-muted-foreground">Ideal para começar agora</p>
            </div>

            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-bold text-foreground">R$ 19,90</span>
              <span className="text-muted-foreground text-base">/mês</span>
            </div>

            <ul className="space-y-3 mb-8">
              {monthlyBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                  <Check className="w-5 h-5 text-neon shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              variant="outline"
              onClick={goToPlan}
              className="w-full border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40 hover:text-white font-semibold rounded-full transition-all duration-300"
            >
              Começar agora
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">Cancele quando quiser. Sem fidelidade.</p>
            <p className="text-center text-xs text-muted-foreground">Acesso imediato após pagamento</p>
          </div>

          {/* ANNUAL */}
          <div className="group relative rounded-2xl md:rounded-3xl border-2 border-neon/70 bg-gradient-to-br from-neon/15 via-card/70 to-muted/20 backdrop-blur-md p-8 md:p-10 transition-all duration-300 scale-[1.02] hover:scale-[1.05] hover:border-neon hover:shadow-[0_20px_60px_-10px_hsl(var(--lp-neon)/0.7)] shadow-[0_15px_50px_-12px_hsl(var(--lp-neon)/0.55)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neon text-white text-xs font-semibold uppercase tracking-wide shadow-[0_0_30px_hsl(var(--lp-neon)/0.5)]">
                <Sparkles className="w-3.5 h-3.5" />
                Melhor escolha
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">Plano Anual</h3>
              <p className="text-sm text-muted-foreground">Economize mais de 35%</p>
            </div>

            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-bold text-foreground">R$ 149,90</span>
              <span className="text-muted-foreground text-base">/ano</span>
            </div>
            <p className="mb-8 text-sm text-neon font-medium">Equivalente a menos de R$ 12/mês</p>

            <ul className="space-y-3 mb-8">
              {annualBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                  <Check className="w-5 h-5 text-neon shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={goToPlan}
              className="w-full bg-neon text-white hover:bg-neon-glow hover:text-white font-semibold rounded-full transition-all duration-300 shadow-[0_0_30px_hsl(var(--lp-neon)/0.5)] hover:shadow-[0_0_40px_hsl(var(--lp-neon)/0.7)]"
            >
              Quero economizar
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">Cancele quando quiser. Sem fidelidade.</p>
            <p className="text-center text-xs text-muted-foreground">Acesso imediato após pagamento</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
