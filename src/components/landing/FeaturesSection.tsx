import { Wallet, CreditCard, TrendingUp, Sparkles, Bell, HeartPulse, Repeat, Target } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  { icon: Wallet, title: "Veja para onde seu dinheiro vai", description: "Registre receitas e despesas em segundos e tenha clareza total de cada real que entra e sai todo mês." },
  { icon: CreditCard, title: "Nunca mais leve susto na fatura", description: "Todos os seus cartões, limites, parcelas e faturas em um único painel — sem surpresas no fim do mês." },
  { icon: TrendingUp, title: "Acompanhe seu patrimônio em tempo real", description: "Investimentos, rentabilidade média e evolução do seu patrimônio atualizados automaticamente para você." },
  { icon: Repeat, title: "Controle assinaturas e recorrentes", description: "Saiba exatamente quanto está comprometido com parcelas e assinaturas — e descubra o que cortar." },
  { icon: HeartPulse, title: "Saúde financeira", description: "Receba uma nota de saúde financeira com diagnóstico claro do que está indo bem — e o que precisa melhorar." },
  { icon: Target, title: "Limites e metas", description: "Defina limites por categoria e metas mensais. O Nexvior te avisa antes de você estourar o orçamento." },
  { icon: Bell, title: "Notificações e calendário", description: "Compromissos financeiros num calendário visual e alertas de vencimentos diretamente no app." },
  { icon: Sparkles, title: "nex.ia, sua mentora", description: "Uma IA financeira que analisa seus dados e responde perguntas como: 'onde posso economizar este mês?'" },
];

export const FeaturesSection = () => {
  return (
    <section id="recursos" className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto">
        <div className="text-center mb-10 md:mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon/10 border border-neon/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-neon"></div>
            <span className="text-xs md:text-sm text-neon font-medium">Tudo que o Nexvior faz por você</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Sua vida financeira, simples e clara
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Do controle de gastos à inteligência artificial que te orienta, o Nexvior reúne tudo que você precisa para tomar decisões melhores com o seu dinheiro.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group relative flex flex-col items-center text-center p-6 h-full bg-card/50 backdrop-blur-sm border-border/50 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-neon/60 hover:bg-card/70 hover:shadow-[0_10px_40px_-10px_hsl(var(--lp-neon)/0.35)]"
            >
              <div className="mb-5 w-14 h-14 rounded-xl bg-neon/10 flex items-center justify-center transition-all duration-300 ease-out group-hover:bg-neon/20 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_24px_-4px_hsl(var(--lp-neon)/0.5)]">
                <feature.icon className="w-7 h-7 text-neon transition-transform duration-300 ease-out" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
