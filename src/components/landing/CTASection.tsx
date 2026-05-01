import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingDown } from "lucide-react";
import { CHECKOUT_MENSAL, CHECKOUT_ANUAL } from "@/config/checkout";

export const CTASection = () => {
  return (
    <section id="beneficios" className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto max-w-4xl">
        <div className="rounded-2xl md:rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 to-muted/20 backdrop-blur-md p-6 md:p-16 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Comece a organizar suas finanças <span className="font-playfair italic">hoje</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-10">
            Junte-se aos usuários que já estão tomando decisões financeiras mais inteligentes com o Nexvior.
            Crie sua conta em menos de um minuto e comece agora.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 max-w-2xl mx-auto">
            <a href={CHECKOUT_MENSAL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-neon text-white hover:bg-neon-glow hover:text-white font-semibold text-sm md:text-base px-5 md:px-7 py-4 md:py-5 rounded-full transition-all duration-300 shadow-[0_0_30px_hsl(var(--lp-neon)/0.4)]"
              >
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                Começar agora
              </Button>
            </a>
            <a href={CHECKOUT_ANUAL} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40 hover:text-white font-semibold text-sm md:text-base px-5 md:px-7 py-4 md:py-5 rounded-full transition-all duration-300"
              >
                <TrendingDown className="w-4 h-4 md:w-5 md:h-5 mr-2 shrink-0" />
                Economizar no anual
              </Button>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Leva menos de 1 minuto para começar • Sem fidelidade • Acesso imediato
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
